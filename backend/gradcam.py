# pip install torch torchvision pillow numpy opencv-python

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import cv2
from PIL import Image
import base64
from io import BytesIO


class GradCAM:
    """
    Grad-CAM implementation for CNN models.
    Uses hooks to capture activations and gradients from target layer.
    """
    
    def __init__(self, model, target_layer):
        """
        Args:
            model: PyTorch model in eval mode
            target_layer: nn.Module to hook (typically last conv layer)
        """
        self.model = model
        self.model.eval()
        self.device = next(model.parameters()).device
        self.activations = None
        self.gradients = None
        
        # Register hooks with more robust gradient capture
        def forward_hook(module, input, output):
            self.activations = output.detach()
        
        def backward_hook(module, grad_in, grad_out):
            # Use grad_out which is the gradient of the output
            # For most layers, grad_out[0] contains the gradient tensor
            if grad_out and grad_out[0] is not None:
                self.gradients = grad_out[0].detach()
            else:
                # Fallback: try grad_in if grad_out is empty
                if grad_in and grad_in[0] is not None:
                    self.gradients = grad_in[0].detach()
        
        self.fwd_handle = target_layer.register_forward_hook(forward_hook)
        # Use register_full_backward_hook for more reliable gradient capture
        self.bwd_handle = target_layer.register_full_backward_hook(backward_hook)
    
    def remove_hooks(self):
        """Clean up hooks"""
        self.fwd_handle.remove()
        self.bwd_handle.remove()
    
    def __call__(self, input_tensor, class_idx=None):
        """
        Generate Grad-CAM heatmap.
        
        Args:
            input_tensor: (1, C, H, W) tensor
            class_idx: target class index (None = predicted class)
            
        Returns:
            heatmap: (H, W) numpy array, values in [0, 1]
        """
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"[GradCAM.__call__] Input shape: {input_tensor.shape}, device: {input_tensor.device}")
        
        self.model.zero_grad()
        input_tensor = input_tensor.to(self.device)
        
        # Forward pass
        out = self.model(input_tensor)
        logits = out[0] if isinstance(out, (tuple, list)) else out
        probs = F.softmax(logits, dim=1)
        
        logger.info(f"[GradCAM.__call__] Logits shape: {logits.shape}, probs: {probs[0].cpu().detach().numpy()}")
        
        # Use predicted class if not specified
        if class_idx is None:
            class_idx = torch.argmax(probs, dim=1).item()
        
        logger.info(f"[GradCAM.__call__] Target class: {class_idx}")
        
        # Backward pass for target class
        score = logits[:, class_idx]
        logger.info(f"[GradCAM.__call__] Score value: {score.item():.4f}")
        
        score.backward(retain_graph=True)
        
        # Get activations and gradients
        activ = self.activations
        grads = self.gradients
        
        logger.info(f"[GradCAM.__call__] Activations shape: {activ.shape if activ is not None else 'None'}")
        logger.info(f"[GradCAM.__call__] Gradients shape: {grads.shape if grads is not None else 'None'}")
        
        if activ is not None:
            logger.info(f"[GradCAM.__call__] Activations - min: {activ.min():.4f}, max: {activ.max():.4f}, mean: {activ.mean():.4f}")
        
        if grads is not None:
            logger.info(f"[GradCAM.__call__] Gradients - min: {grads.min():.4f}, max: {grads.max():.4f}, mean: {grads.mean():.4f}")
            logger.info(f"[GradCAM.__call__] Gradients are zeros: {(grads == 0).all().item()}")
        
        if activ is None or grads is None:
            raise RuntimeError("Activations or gradients not captured. Check target layer.")
        
        # Compute weights (global average pooling of gradients)
        weights = torch.mean(grads, dim=(2, 3), keepdim=True)
        logger.info(f"[GradCAM.__call__] Weights shape: {weights.shape}, values - min: {weights.min():.4f}, max: {weights.max():.4f}")
        
        # Weighted combination of activation maps
        gcam_map = torch.sum(weights * activ, dim=1, keepdim=True)
        gcam_map = F.relu(gcam_map)  # ReLU to keep positive influence
        
        logger.info(f"[GradCAM.__call__] GradCAM map before upsample: min: {gcam_map.min():.4f}, max: {gcam_map.max():.4f}, shape: {gcam_map.shape}")
        
        # Upsample to input size
        gcam_map = F.interpolate(
            gcam_map,
            size=(input_tensor.shape[2], input_tensor.shape[3]),
            mode='bilinear',
            align_corners=False
        )
        
        logger.info(f"[GradCAM.__call__] GradCAM map after upsample: shape: {gcam_map.shape}, min: {gcam_map.min():.4f}, max: {gcam_map.max():.4f}")
        
        # Normalize to [0, 1]
        gcam_map = gcam_map.squeeze().cpu().numpy()
        
        logger.info(f"[GradCAM.__call__] Before normalization - min: {gcam_map.min():.4f}, max: {gcam_map.max():.4f}")
        
        gcam_map -= gcam_map.min()
        if gcam_map.max() > 0:
            gcam_map /= gcam_map.max()
        else:
            logger.warning("[GradCAM.__call__] GradCAM map is all zeros! Model not focusing on anything.")
        
        logger.info(f"[GradCAM.__call__] After normalization - min: {gcam_map.min():.4f}, max: {gcam_map.max():.4f}, mean: {gcam_map.mean():.4f}")
        logger.info(f"[GradCAM.__call__] Non-zero pixels: {np.count_nonzero(gcam_map)}/{gcam_map.size}")
        
        return gcam_map


def create_heatmap_overlay(original_image, heatmap, alpha=0.4, colormap=cv2.COLORMAP_JET):
    """
    Create overlay of heatmap on original image.
    
    Args:
        original_image: PIL Image or numpy array (H, W, 3)
        heatmap: numpy array (H, W) with values in [0, 1]
        alpha: transparency of heatmap overlay
        colormap: OpenCV colormap
        
    Returns:
        overlay_img: PIL Image with heatmap overlay
    """
    # Convert PIL to numpy if needed
    if isinstance(original_image, Image.Image):
        img_np = np.array(original_image)
    else:
        img_np = original_image
    
    # Ensure RGB
    if img_np.shape[-1] == 4:  # RGBA
        img_np = img_np[:, :, :3]
    
    # Resize heatmap to match image
    if heatmap.shape != img_np.shape[:2]:
        heatmap = cv2.resize(heatmap, (img_np.shape[1], img_np.shape[0]))
    
    # Convert heatmap to color
    heatmap_uint8 = np.uint8(255 * heatmap)
    heatmap_color = cv2.applyColorMap(heatmap_uint8, colormap)
    heatmap_color = cv2.cvtColor(heatmap_color, cv2.COLOR_BGR2RGB)
    
    # Blend
    overlay = cv2.addWeighted(img_np, 1 - alpha, heatmap_color, alpha, 0)
    
    return Image.fromarray(overlay)


def heatmap_to_base64(overlay_image):
    """
    Convert PIL Image to base64 PNG string for JSON response.
    
    Args:
        overlay_image: PIL Image
        
    Returns:
        base64_str: base64-encoded PNG string
    """
    buffer = BytesIO()
    overlay_image.save(buffer, format="PNG")
    buffer.seek(0)
    img_bytes = buffer.read()
    base64_str = base64.b64encode(img_bytes).decode('utf-8')
    return base64_str


def generate_gradcam(model, input_tensor, original_image, target_layer, class_idx=None):
    """
    Complete Grad-CAM pipeline: generate heatmap and overlay.
    
    Args:
        model: PyTorch model
        input_tensor: preprocessed input (1, C, H, W)
        original_image: PIL Image (original size)
        target_layer: nn.Module to hook
        class_idx: target class (None = predicted)
        
    Returns:
        dict with keys:
            - heatmap: numpy array (H, W)
            - overlay_image: PIL Image
            - base64_png: base64 string
            - class_idx: int
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Create GradCAM
    cam = GradCAM(model, target_layer)
    
    # Generate heatmap
    heatmap = cam(input_tensor, class_idx=class_idx)
    
    logger.info(f"[GradCAM] Heatmap shape: {heatmap.shape}")
    logger.info(f"[GradCAM] Heatmap min: {heatmap.min():.4f}, max: {heatmap.max():.4f}, mean: {heatmap.mean():.4f}")
    logger.info(f"[GradCAM] Non-zero pixels: {np.count_nonzero(heatmap)}/{heatmap.size}")
    
    # Get predicted class if not provided
    if class_idx is None:
        with torch.no_grad():
            out = model(input_tensor)
            logits = out[0] if isinstance(out, (tuple, list)) else out
            class_idx = torch.argmax(logits, dim=1).item()
    
    # Create overlay
    overlay_img = create_heatmap_overlay(original_image, heatmap)
    
    # Convert to base64
    base64_png = heatmap_to_base64(overlay_img)
    
    logger.info(f"[GradCAM] Base64 PNG length: {len(base64_png)} chars")
    
    # Cleanup
    cam.remove_hooks()
    
    return {
        "heatmap": heatmap,
        "overlay_image": overlay_img,
        "base64_png": base64_png,
        "class_idx": class_idx,
        "heatmap_shape": list(heatmap.shape)
    }
