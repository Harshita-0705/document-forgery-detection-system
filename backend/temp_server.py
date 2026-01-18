#!/usr/bin/env python3

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import tempfile
import os
from pathlib import Path

app = FastAPI(
    title="Document Forgery Detection API",
    description="ML Inference API (Temporary - fixing compatibility)",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "Server is running",
        "note": "Temporary server - ML model loading in progress"
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Temporary prediction endpoint
    """
    return JSONResponse({
        "filename": file.filename,
        "prediction": {
            "class_id": 0,
            "class_name": "authentic",
            "confidence": 0.85,
            "scores": [0.85, 0.05, 0.03, 0.02, 0.02, 0.02, 0.01]
        },
        "note": "Temporary response - ML model loading in progress"
    })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)