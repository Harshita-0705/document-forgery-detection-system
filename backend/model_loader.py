# pip install torch torchvision pillow numpy opencv-python

import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import numpy as np
import cv2
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# ============================================================
# MODEL ARCHITECTURE (from notebook)
# ============================================================

class ChannelAttention(nn.Module):
    def __init__(self, ch, reduction=16):
        super().__init__()
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.fc = nn.Sequential(
            nn.Linear(ch, max(ch // reduction, 1)),
            nn.ReLU(inplace=True),
            nn.Linear(max(ch // reduction, 1), ch),
            nn.Sigmoid()
        )

    def forward(self, x):
        b, c, _, _ = x.size()
        y = self.pool(x).view(b, c)
        y = self.fc(y).view(b, c, 1, 1)
        return x * y


class SpatialAttention(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv = nn.Conv2d(2, 1, kernel_size=7, padding=3)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        avg = torch.mean(x, dim=1, keepdim=True)
        mx, _ = torch.max(x, dim=1, keepdim=True)
        cat = torch.cat([avg, mx], dim=1)
        return x * self.sigmoid(self.conv(cat))


class CBAM(nn.Module):
    def __init__(self, ch):
        super().__init__()
        self.ca = ChannelAttention(ch)
        self.sa = SpatialAttention()

    def forward(self, x):
        x = self.ca(x)
        x = self.sa(x)
        return x


class ForgeryNet(nn.Module):
    def __init__(self, img_size=256, num_classes=7, ocr_vocab_size=128, max_ocr_tokens=64):
        super().__init__()
        self.img_size = img_size
        self.num_classes = num_classes
        self.max_ocr_tokens = max_ocr_tokens

        # Backbone: EfficientNet-B3 (fallback to B0)
        try:
            weights = models.EfficientNet_B3_Weights.DEFAULT
            backbone = models.efficientnet_b3(weights=weights)
        except:
            try:
                backbone = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)
            except:
                backbone = models.efficientnet_b0(pretrained=True)

        self.back = backbone.features

        # Probe output channels
        with torch.no_grad():
            dummy = torch.zeros(1, 3, img_size, img_size)
            ch = self.back(dummy).shape[1]

        self.cbam = CBAM(ch)
        self.pool = nn.AdaptiveAvgPool2d(1)

        # Edge branch
        self.edge_branch = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=7, stride=2, padding=3),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten()
        )

        # OCR branch
        self.ocr_emb = nn.Embedding(ocr_vocab_size, 64, padding_idx=0)
        self.ocr_pool = nn.AdaptiveAvgPool1d(1)
        self.ocr_head = nn.Linear(64, 32)

        # Fusion classifier
        fusion_dim = ch + 32 + 32
        self.classifier = nn.Sequential(
            nn.Linear(fusion_dim, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(256, 128),
            nn.ReLU(inplace=True),
            nn.Linear(128, num_classes)
        )

    def forward(self, img, edge, ocr):
        x = self.back(img)
        x = self.cbam(x)
        x = self.pool(x).view(x.size(0), -1)

        e = self.edge_branch(edge)

        o = self.ocr_emb(ocr)
        o = o.permute(0, 2, 1)
        o = self.ocr_pool(o).squeeze(-1)
        o = self.ocr_head(o.float())

        f = torch.cat([x, e, o], dim=1)
        return self.classifier(f)


# ============================================================
# MODEL LOADER
# ============================================================

class ModelLoader:
    def __init__(self, model_path, device="cpu", img_size=256):
        logger.info("Initializing ModelLoader...")
        self.device = torch.device(device)
        self.img_size = img_size
        self.num_classes = 7
        self.max_ocr_tokens = 64
        
        # Class names
        self.class_names = [
            "positive",
            "copy_move",
            "face_morph",
            "face_replace",
            "combined",
            "inpaint_rewrite",
            "crop_replace"
        ]
        logger.info(f"Classes: {self.class_names}")
        
        # Load model
        logger.info("Creating ForgeryNet model...")
        self.model = ForgeryNet(
            img_size=img_size,
            num_classes=self.num_classes,
            ocr_vocab_size=128,
            max_ocr_tokens=self.max_ocr_tokens
        )
        
        logger.info(f"Loading weights from: {model_path}")
        state_dict = torch.load(model_path, map_location=self.device, weights_only=False)
        logger.info(f"State dict keys: {len(state_dict)} parameters")
        
        self.model.load_state_dict(state_dict)
        self.model.to(self.device)
        self.model.eval()
        logger.info(f"Model moved to device: {self.device}")
        logger.info("Model set to eval mode")
        
        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((img_size, img_size)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        logger.info("Transform pipeline created")
    
    def extract_edges(self, pil_img):
        """Extract edge map using Canny edge detection"""
        gray = cv2.cvtColor(
            np.array(pil_img.resize((self.img_size, self.img_size))),
            cv2.COLOR_RGB2GRAY
        )
        
        # Adaptive thresholds
        median = np.median(gray)
        lower = int(max(0, 0.7 * median))
        upper = int(min(255, 1.3 * median))
        
        edge = cv2.Canny(gray, lower, upper).astype("float32") / 255.0
        return torch.from_numpy(edge).unsqueeze(0).float()
    
    def predict(self, image_path_or_pil):
        """
        Predict forgery class for an image.
        
        Args:
            image_path_or_pil: str path or PIL Image
            
        Returns:
            dict with keys: class_id, class_name, scores, confidence
        """
        logger.info("Starting prediction...")
        
        # Load image
        if isinstance(image_path_or_pil, (str, Path)):
            img = Image.open(image_path_or_pil).convert("RGB")
            logger.info(f"Loaded image from path: {image_path_or_pil}")
        else:
            img = image_path_or_pil.convert("RGB")
            logger.info(f"Using PIL image, size: {img.size}")
        
        # Preprocess
        logger.info("Preprocessing image...")
        img_tensor = self.transform(img).unsqueeze(0).to(self.device)
        logger.info(f"Image tensor shape: {img_tensor.shape}, device: {img_tensor.device}")
        logger.info(f"Image tensor min: {img_tensor.min():.4f}, max: {img_tensor.max():.4f}")
        
        edge_tensor = self.extract_edges(img).unsqueeze(0).to(self.device)
        logger.info(f"Edge tensor shape: {edge_tensor.shape}")
        
        # OCR placeholder (zeros for inference without OCR)
        ocr_tensor = torch.zeros((1, self.max_ocr_tokens), dtype=torch.long).to(self.device)
        logger.info(f"OCR tensor shape: {ocr_tensor.shape}")
        
        # Inference
        logger.info("Running model inference...")
        with torch.no_grad():
            logits = self.model(img_tensor, edge_tensor, ocr_tensor)
            logger.info(f"Logits shape: {logits.shape}")
            logger.info(f"Logits values: {logits[0].cpu().numpy()}")
            
            probs = torch.softmax(logits, dim=1)
            logger.info(f"Probabilities: {probs[0].cpu().numpy()}")
            
            class_id = torch.argmax(probs, dim=1).item()
            confidence = probs[0, class_id].item()
            scores = probs[0].cpu().numpy().tolist()
            
            logger.info(f"Predicted class: {class_id} ({self.class_names[class_id]})")
            logger.info(f"Confidence: {confidence:.4f}")
        
        return {
            "class_id": class_id,
            "class_name": self.class_names[class_id],
            "confidence": confidence,
            "scores": scores
        }
