"""
backend/metrics_engine.py  —  TESSERACTZ
Quality evaluation: PSNR · SSIM · LPIPS · GradCAM activation maps.

All metrics compare the CLAHE-preprocessed IR baseline against the
generated Enhanced (SR) and Colorized outputs, giving judges a live
quantitative signal of pipeline performance.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

import cv2
import numpy as np
import torch

if TYPE_CHECKING:
    from inference_engine import InferenceEngine

logger = logging.getLogger(__name__)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _match_shape(ref: np.ndarray, target: np.ndarray) -> np.ndarray:
    """Resize target to ref's spatial dimensions if they differ."""
    if ref.shape[:2] != target.shape[:2]:
        target = cv2.resize(target, (ref.shape[1], ref.shape[0]), interpolation=cv2.INTER_AREA)
    return target


def _to_rgb3(img: np.ndarray) -> np.ndarray:
    """Guarantee a (H, W, 3) uint8 RGB array."""
    if img.ndim == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
    elif img.shape[2] == 4:
        img = img[:, :, :3]
    return img


# ─── PSNR ────────────────────────────────────────────────────────────────────

def compute_psnr(ref: np.ndarray, target: np.ndarray, max_dim: int = 1024) -> float:
    """
    Peak Signal-to-Noise Ratio (dB).
    Higher is better.  Typical range for compressed imagery: 25–45 dB.
    """
    ref    = _to_rgb3(ref)
    target = _to_rgb3(_match_shape(ref, target))
    
    h, w = ref.shape[:2]
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        new_w, new_h = int(w * scale), int(h * scale)
        ref = cv2.resize(ref, (new_w, new_h), interpolation=cv2.INTER_AREA)
        target = cv2.resize(target, (new_w, new_h), interpolation=cv2.INTER_AREA)

    mse = np.mean((ref.astype(np.float64) - target.astype(np.float64)) ** 2)
    if mse < 1e-10:
        return 100.0
    return round(float(10.0 * np.log10(255.0 ** 2 / mse)), 4)


# ─── SSIM ────────────────────────────────────────────────────────────────────

def compute_ssim(ref: np.ndarray, target: np.ndarray, max_dim: int = 1024) -> float:
    """
    Structural Similarity Index (0–1).
    Higher is better.  Uses scikit-image; falls back to manual windowed SSIM.
    """
    ref    = _to_rgb3(ref)
    target = _to_rgb3(_match_shape(ref, target))

    h, w = ref.shape[:2]
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        new_w, new_h = int(w * scale), int(h * scale)
        ref = cv2.resize(ref, (new_w, new_h), interpolation=cv2.INTER_AREA)
        target = cv2.resize(target, (new_w, new_h), interpolation=cv2.INTER_AREA)

    try:
        from skimage.metrics import structural_similarity
        return round(float(
            structural_similarity(ref, target, multichannel=True, channel_axis=2, data_range=255)
        ), 4)
    except ImportError:
        # Manual single-channel approximation
        gray_ref = cv2.cvtColor(ref, cv2.COLOR_RGB2GRAY).astype(np.float64)
        gray_tgt = cv2.cvtColor(target, cv2.COLOR_RGB2GRAY).astype(np.float64)
        C1, C2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
        mu1, mu2 = cv2.GaussianBlur(gray_ref, (11, 11), 1.5), cv2.GaussianBlur(gray_tgt, (11, 11), 1.5)
        mu1_sq, mu2_sq, mu12 = mu1 ** 2, mu2 ** 2, mu1 * mu2
        s1 = cv2.GaussianBlur(gray_ref ** 2, (11, 11), 1.5) - mu1_sq
        s2 = cv2.GaussianBlur(gray_tgt ** 2, (11, 11), 1.5) - mu2_sq
        s12 = cv2.GaussianBlur(gray_ref * gray_tgt, (11, 11), 1.5) - mu12
        ssim_map = ((2 * mu12 + C1) * (2 * s12 + C2)) / ((mu1_sq + mu2_sq + C1) * (s1 + s2 + C2))
        return round(float(ssim_map.mean()), 4)


# ─── LPIPS ───────────────────────────────────────────────────────────────────

_lpips_fn = None   # cached lazily


def compute_lpips(ref: np.ndarray, target: np.ndarray) -> float:
    """
    Learned Perceptual Image Patch Similarity (0–1).
    Lower is better.  Uses AlexNet backbone via the `lpips` package.
    Falls back to normalised MSE if package is absent.
    """
    global _lpips_fn
    ref    = _to_rgb3(ref)
    target = _to_rgb3(_match_shape(ref, target))

    try:
        import lpips
        from inference_engine import engine
        device = engine.device

        if _lpips_fn is None:
            _lpips_fn = lpips.LPIPS(net="alex", verbose=False).to(device)

        def _t(img: np.ndarray) -> torch.Tensor:
            img_rs = cv2.resize(img, (256, 256))
            return (
                torch.from_numpy(img_rs).float().permute(2, 0, 1).unsqueeze(0) / 127.5 - 1.0
            ).to(device)

        with torch.no_grad():
            score = _lpips_fn(_t(ref), _t(target))
        return round(float(score.item()), 4)

    except Exception as exc:
        logger.warning(f"LPIPS Similarity failed: {exc} — falling back to normalized MSE.")
        mse = np.mean((ref.astype(np.float64) - target.astype(np.float64)) ** 2)
        return round(float(mse / (255.0 ** 2)), 4)


# ─── GradCAM (activation-map variant) ────────────────────────────────────────

def generate_gradcam(engine: "InferenceEngine", overlay_target: np.ndarray) -> np.ndarray:
    """
    Generate a spatial explainability heatmap from the backbone's deepest
    feature map (channel-mean activation — no backward pass required for
    zero-shot inference).

    The heatmap is blended with overlay_target (the colorized output) so
    analysts can immediately correlate attention with detected objects.

    Args:
        engine:         InferenceEngine singleton (holds _last_features).
        overlay_target: (H, W, 3) uint8 RGB — colorized output frame.

    Returns:
        (H, W, 3) uint8 RGB — JET heatmap blended 45/55 with colorized image.
    """
    H, W = overlay_target.shape[:2]

    if engine._last_features is None:
        logger.warning("No backbone features cached — returning blank GradCAM.")
        return overlay_target.copy()

    # Use the final (semantically richest) feature map
    feat = engine._last_features[-1]           # (1, C, h, w)

    # Channel-mean → spatial attention map
    cam = feat.mean(dim=1).squeeze(0).cpu().numpy()   # (h, w)
    cam = np.maximum(cam, 0.0)                          # ReLU
    cam = cv2.normalize(cam, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    cam = cv2.resize(cam, (W, H), interpolation=cv2.INTER_CUBIC)

    heatmap_bgr = cv2.applyColorMap(cam, cv2.COLORMAP_JET)
    heatmap_rgb = cv2.cvtColor(heatmap_bgr, cv2.COLOR_BGR2RGB)

    # Blend: 45% heatmap, 55% colorized image
    overlay = cv2.addWeighted(heatmap_rgb, 0.45, overlay_target, 0.55, 0)
    return overlay


# ─── Batch runner ────────────────────────────────────────────────────────────

def run_all_metrics(
    preprocessed: np.ndarray,
    enhanced: np.ndarray,
    colorized: np.ndarray,
) -> dict:
    """
    Compute all quality metrics comparing the CLAHE-preprocessed IR baseline
    against the SR-enhanced and colorized outputs.

    Returns a flat dict of metric names → float values.
    """
    gray_rgb = cv2.cvtColor(preprocessed, cv2.COLOR_GRAY2RGB)

    # Downsample enhanced to baseline resolution for fair comparison
    enhanced_ds = cv2.resize(
        enhanced, (preprocessed.shape[1], preprocessed.shape[0]),
        interpolation=cv2.INTER_AREA,
    )

    return {
        "psnr_enhanced":   compute_psnr(gray_rgb, enhanced_ds),
        "psnr_colorized":  compute_psnr(gray_rgb, colorized),
        "ssim_enhanced":   compute_ssim(gray_rgb, enhanced_ds),
        "ssim_colorized":  compute_ssim(gray_rgb, colorized),
        "lpips_colorized": compute_lpips(gray_rgb, colorized),
    }


def update_lpips_device(device: str) -> None:
    """Migrate the cached LPIPS function model to the target device."""
    global _lpips_fn
    if _lpips_fn is not None:
        try:
            _lpips_fn = _lpips_fn.to(device)
            logger.info(f"LPIPS function migrated to {device}")
        except Exception as e:
            logger.warning(f"Could not migrate LPIPS function to device {device}: {e}")


def warm_up_lpips() -> None:
    """Pre-load and warm up the LPIPS model on the active device."""
    global _lpips_fn
    try:
        import lpips
        from inference_engine import engine
        device = engine.device
        if _lpips_fn is None:
            logger.info("Pre-loading LPIPS (AlexNet) model...")
            _lpips_fn = lpips.LPIPS(net="alex", verbose=False).to(device)
            logger.info("LPIPS model pre-loaded successfully.")
    except Exception as e:
        logger.warning(f"Could not pre-load LPIPS model: {e}")

