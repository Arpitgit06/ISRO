"""
backend/main.py  —  TESSERACTZ
FastAPI application: async image upload → inference → metrics → JSON response.
"""

from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from inference_engine import DEVICE, DEVICE_LABEL, engine
from metrics_engine import generate_gradcam, run_all_metrics
from schemas.response_schemas import ProcessResponse
from utils.image_utils import numpy_to_b64, read_upload_bytes

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger("tesseractz.api")

# ─── Lifespan ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Pre-load all models before the first request arrives."""
    logger.info("▶  TESSERACTZ API starting up — warming engine…")
    engine.warm_up()
    logger.info("✓  Engine warm.  Ready to receive missions.")
    yield
    logger.info("◼  TESSERACTZ API shutting down.")


# ─── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="TESSERACTZ Inference API",
    description="IR image colorization & enhancement — Bharatiya Antariksh Hackathon",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    """Liveness + readiness probe."""
    import torch
    from inference_engine import DEVICE, DEVICE_LABEL

    gpu_name = None
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
    elif DEVICE != "cpu":
        gpu_name = DEVICE_LABEL

    return {
        "status":  "operational",
        "device":  DEVICE,
        "device_label": DEVICE_LABEL,
        "device_type": "gpu" if DEVICE != "cpu" else "cpu",
        "gpu_name": gpu_name,
        "engine_ready": engine._ready,
        "models": {
            "backbone":    "resnet50 (timm)",
            "sr":          "Real-ESRGAN x4plus" if (engine._ready and engine.enhancer._upsampler) else "bicubic fallback",
            "colorizer":   "eccv16 neural"      if (engine._ready and engine.colorizer._model)  else "histogram fallback",
            "detector":    engine.detector._mode if engine._ready else "not loaded",
        },
    }


@app.post("/api/process", response_model=ProcessResponse)
async def process_image(
    file: UploadFile = File(..., description="IR image — TIF / PNG / JPEG"),
    run_detection: bool = True,
):
    """
    Full TESSERACTZ pipeline.

    Accepts a raw IR frame (single-channel or BGR), returns:
    - Base64-encoded images  (raw, preprocessed, enhanced, colorized, gradcam)
    - YOLO detection boxes
    - PSNR / SSIM / LPIPS metrics
    - Per-stage latency timings
    """
    # ── Validate mime type ──
    allowed = {"image/tiff", "image/png", "image/jpeg", "image/jpg", "application/octet-stream"}
    if file.content_type not in allowed:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {file.content_type}. Use TIF, PNG, or JPEG.",
        )

    # ── Decode upload bytes → numpy ──
    t_upload = time.perf_counter()
    raw_bytes = await file.read()
    raw_np = read_upload_bytes(raw_bytes)
    upload_ms = round((time.perf_counter() - t_upload) * 1000, 2)
    logger.info(f"Received {file.filename!r} — shape {raw_np.shape}, dtype {raw_np.dtype}  ({upload_ms} ms)")

    # ── Stash a uint8 grayscale copy as the display "raw" ──
    raw_display = raw_np.copy()
    if raw_display.ndim == 3:
        raw_display = cv2.cvtColor(raw_display[:, :, :3], cv2.COLOR_BGR2GRAY)
    if raw_display.dtype != np.uint8:
        raw_display = cv2.normalize(raw_display, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)

    # ── Run inference pipeline ──
    try:
        result = engine.run_pipeline(raw_np, run_detection=run_detection)
    except Exception as exc:
        logger.exception("Pipeline failure")
        raise HTTPException(status_code=500, detail=f"Inference failed: {exc}")

    # ── Compute quality metrics ──
    t_metrics = time.perf_counter()
    metrics = run_all_metrics(
        preprocessed=result["preprocessed"],
        enhanced=result["enhanced"],
        colorized=result["colorized"],
    )
    metrics_ms = round((time.perf_counter() - t_metrics) * 1000, 2)

    # ── GradCAM ──
    gradcam_overlay = generate_gradcam(engine, result["colorized"])

    # ── Build latency dict (add upload + metrics) ──
    latency = result["latency_ms"]
    latency["upload_ms"]  = upload_ms
    latency["metrics_ms"] = metrics_ms
    latency["total_ms"]   = round(sum(v for k, v in latency.items() if k != "total_ms"), 2)

    logger.info(
        f"Pipeline complete — {latency['total_ms']} ms total | "
        f"detections: {result['class_counts']}"
    )

    # ── Encode images to base64 PNG ──
    images = {
        "raw":         numpy_to_b64(cv2.cvtColor(raw_display, cv2.COLOR_GRAY2RGB)),
        "preprocessed": numpy_to_b64(cv2.cvtColor(result["preprocessed"], cv2.COLOR_GRAY2RGB)),
        "enhanced":    numpy_to_b64(result["enhanced"]),
        "colorized":   numpy_to_b64(result["colorized"]),
        "gradcam":     numpy_to_b64(gradcam_overlay),
    }

    return JSONResponse(content={
        "status":       "success",
        "filename":     file.filename,
        "images":       images,
        "detections":   result["detections"],
        "class_counts": result["class_counts"],
        "metrics":      metrics,
        "latency_ms":   latency,
    })


@app.get("/")
async def root():
    return {"message": "TESSERACTZ Inference API — /api/process | /api/health | /docs"}
