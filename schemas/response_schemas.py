"""backend/schemas/response_schemas.py — TESSERACTZ"""

from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field


class Detection(BaseModel):
    label:      str
    confidence: float = Field(..., ge=0.0, le=1.0)
    bbox:       list[float] = Field(..., min_length=4, max_length=4,
                                    description="[x1, y1, x2, y2] in pixel coords")


class MetricsResult(BaseModel):
    psnr_enhanced:   float = Field(..., description="PSNR vs SR-enhanced output (dB)")
    psnr_colorized:  float = Field(..., description="PSNR vs colorized output (dB)")
    ssim_enhanced:   float = Field(..., description="SSIM vs SR-enhanced output (0–1)")
    ssim_colorized:  float = Field(..., description="SSIM vs colorized output (0–1)")
    lpips_colorized: float = Field(..., description="LPIPS vs colorized output (lower=better)")


class LatencyBreakdown(BaseModel):
    upload_ms:        float = 0.0
    preprocessing_ms: float = 0.0
    backbone_ms:      float = 0.0
    esrgan_ms:        float = 0.0
    colorization_ms:  float = 0.0
    detection_ms:     float = 0.0
    metrics_ms:       float = 0.0
    total_ms:         float = 0.0


class ImageSet(BaseModel):
    raw:          str = Field(..., description="Base64-encoded PNG — raw IR frame")
    preprocessed: str = Field(..., description="Base64-encoded PNG — CLAHE output")
    enhanced:     str = Field(..., description="Base64-encoded PNG — Real-ESRGAN 4× SR")
    colorized:    str = Field(..., description="Base64-encoded PNG — colorized RGB")
    gradcam:      str = Field(..., description="Base64-encoded PNG — GradCAM overlay")


class ProcessResponse(BaseModel):
    status:       str
    filename:     Optional[str] = None
    images:       dict          # ImageSet (returned as plain dict for speed)
    detections:   list[Detection]
    class_counts: dict[str, int]
    metrics:      dict          # MetricsResult
    latency_ms:   dict          # LatencyBreakdown
