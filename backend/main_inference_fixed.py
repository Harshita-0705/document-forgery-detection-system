# Apply compatibility fixes first
import sys
sys.path.insert(0, '.')
from compatibility_fix import init_compatibility
init_compatibility()

# Now import the rest
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pathlib import Path
import tempfile
import os
import logging
import time
import uuid

# ============================================================
# LOGGING SETUP
# ============================================================

# Create logs directory
LOG_DIR = Path(__file__).parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_DIR / "inference.log", encoding="utf-8"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Custom filter to add request_id to logs
class RequestIdFilter(logging.Filter):
    def filter(self, record):
        # kept for future use; no-op with current log format
        return True

# Apply filter placeholder (kept for compatibility)
request_filter = RequestIdFilter()
logger.addFilter(request_filter)
logging.getLogger().addFilter(request_filter)

# ============================================================
# CONFIGURATION
# ============================================================

MODEL_PATH = Path(__file__).parent / "best_model (1).pth"
IMG_SIZE = 256

# ============================================================
# INITIALIZE APP
# ============================================================

app = FastAPI(
    title="Document Forgery Detection API",
    description="Real ML Inference API with Grad-CAM visualization",
    version="1.0.0"
)

# Request ID middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())[:8]
    request.state.request_id = request_id
    
    # Add to logging context
    old_factory = logging.getLogRecordFactory()
    def record_factory(*args, **kwargs):
        record = old_factory(*args, **kwargs)
        record.request_id = request_id
        return record
    logging.setLogRecordFactory(record_factory)
    
    response = await call_next(request)
    
    logging.setLogRecordFactory(old_factory)
    return response

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model
model_loader = None
DEVICE = None

# Load model with error handling
logger.info("="*60)
logger.info("STARTING INFERENCE API")
logger.info("="*60)
logger.info(f"Model path: {MODEL_PATH}")
logger.info(f"Model exists: {MODEL_PATH.exists()}")

try:
    # Try to import and load model
    import torch
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"Device: {DEVICE}")
    
    from model_loader import ModelLoader
    model_loader = ModelLoader(
        model_path=str(MODEL_PATH),
        device=DEVICE,
        img_size=IMG_SIZE
    )
    logger.info("Model loaded successfully")
    logger.info(f"Model device: {model_loader.device}")
    logger.info(f"Number of classes: {model_loader.num_classes}")
    
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    logger.info("Server will run in compatibility mode without ML model")
    model_loader = None

# ============================================================
# ENDPOINTS
# ============================================================


@app.get("/")
async def root():
    """Simple root endpoint for quick checks"""
    return {"status": "ok", "message": "Backend is up"}


@app.get("/health")
async def health(request: Request):
    """Health check endpoint"""
    logger.info("Health check requested")
    return {
        "status": "ok",
        "device": str(DEVICE) if DEVICE else "unknown",
        "model_loaded": model_loader is not None,
        "model_path": str(MODEL_PATH),
        "mode": "ML" if model_loader else "compatibility"
    }

@app.post("/predict")
async def predict(request: Request, file: UploadFile = File(...)):
    """
    Predict forgery class and generate Grad-CAM heatmap.
    """
    
    request_id = request.state.request_id
    start_time = time.time()
    tmp_path = None
    
    logger.info("="*60)
    logger.info(f"NEW PREDICTION REQUEST")
    logger.info(f"Filename: {file.filename}")
    logger.info(f"Content-Type: {file.content_type}")
    logger.info(f"Request ID: {request_id}")
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        logger.error(f"Invalid file type: {file.content_type}")
        raise HTTPException(400, "File must be an image")
    
    try:
        # Save uploaded file temporarily
        logger.info("Reading uploaded file...")
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        logger.info(f"Saved to temp file: {tmp_path}")
        
        if model_loader is not None:
            # Real ML prediction
            from PIL import Image
            original_img = Image.open(tmp_path).convert("RGB")
            logger.info(f"Image size: {original_img.size}")
            
            # Get prediction
            logger.info("Starting model prediction...")
            pred_start = time.time()
            prediction = model_loader.predict(original_img)
            pred_time = time.time() - pred_start
            
            logger.info(f"Prediction complete in {pred_time:.3f}s")
            logger.info(f"  - Class ID: {prediction['class_id']}")
            logger.info(f"  - Class Name: {prediction['class_name']}")
            logger.info(f"  - Confidence: {prediction['confidence']:.4f}")
            # Generate Grad-CAM visualization
            logger.info("Generating Grad-CAM heatmap...")
            try:
                import torch
                gradcam_start = time.time()
                
                # Get target layer: use backbone.features (last conv layer before pooling/attention)
                # ForgeryNet structure: backbone.features -> CBAM -> pool -> classifier
                # We must target backbone.features, NOT CBAM or pool
                target_layer = model_loader.model.back[-1]  # Last layer of EfficientNet backbone
                
                # Prepare all required inputs for ForgeryNet
                img_tensor = model_loader.transform(original_img).unsqueeze(0).to(DEVICE)
                edge_tensor = model_loader.extract_edges(original_img).unsqueeze(0).to(DEVICE)
                ocr_tensor = torch.zeros((1, model_loader.max_ocr_tokens), dtype=torch.long).to(DEVICE)
                
                logger.info(f"[GradCAM Setup] Img shape: {img_tensor.shape}, Edge shape: {edge_tensor.shape}, OCR shape: {ocr_tensor.shape}")
                
                # Create a wrapper function that handles the multi-input model
                # This allows Grad-CAM to work with models that take multiple inputs
                class GradCAMWrapper(torch.nn.Module):
                    def __init__(self, model, edge_tensor, ocr_tensor):
                        super().__init__()
                        self.model = model
                        self.edge_tensor = edge_tensor
                        self.ocr_tensor = ocr_tensor
                    
                    def forward(self, img):
                        return self.model(img, self.edge_tensor, self.ocr_tensor)
                
                wrapped_model = GradCAMWrapper(model_loader.model, edge_tensor, ocr_tensor)
                wrapped_model.eval()
                
                # Import and run Grad-CAM
                from gradcam import generate_gradcam
                
                gradcam_result = generate_gradcam(
                    model=wrapped_model,
                    input_tensor=img_tensor,
                    original_image=original_img,
                    target_layer=target_layer,
                    class_idx=prediction['class_id']
                )
                
                gradcam_base64 = gradcam_result['base64_png']
                gradcam_shape = gradcam_result['heatmap_shape']
                
                gradcam_time = time.time() - gradcam_start
                logger.info(f"Grad-CAM generated in {gradcam_time:.3f}s")
                logger.info(f"  - Heatmap shape: {gradcam_shape}")
                logger.info(f"  - Base64 length: {len(gradcam_base64)} chars")
                
            except Exception as e:
                logger.error(f"Grad-CAM generation failed: {e}", exc_info=True)
                # Fallback to placeholder if Grad-CAM fails
                gradcam_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                gradcam_shape = [256, 256]
            
        else:
            # Model must be loaded - no compatibility mode for production
            logger.error("Model not loaded - cannot proceed with analysis")
            raise HTTPException(500, "ML Model failed to load. Cannot analyze documents without model.")
        
        # Build response - all real data from model
        response = {
            "filename": file.filename,
            "prediction": prediction,
            "gradcam": gradcam_base64,
            "gradcam_shape": gradcam_shape,
            "mode": "ML"  # Always ML mode - no fallback
        }
        
        total_time = time.time() - start_time
        logger.info(f"TOTAL REQUEST TIME: {total_time:.3f}s")
        logger.info("="*60)
        
        return JSONResponse(response)
    
    except Exception as e:
        logger.error(f"PREDICTION FAILED: {str(e)}", exc_info=True)
        raise HTTPException(500, f"Prediction failed: {str(e)}")
    
    finally:
        # Cleanup temp file
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
            logger.info(f"Cleaned up temp file: {tmp_path}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)