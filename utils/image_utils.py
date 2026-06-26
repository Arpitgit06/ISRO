"""backend/utils/image_utils.py — TESSERACTZ"""

from __future__ import annotations

import base64

import cv2
import numpy as np


def numpy_to_b64(img: np.ndarray, fmt: str = ".png") -> str:
    """
    Encode a numpy array (uint8, any channel count) to a base64 PNG/JPEG string.
    Frontend renders it as: <img src={`data:image/png;base64,${b64}`} />
    """
    if img.ndim == 3 and img.shape[2] == 3:
        # Assume RGB input from our pipeline — convert to BGR for OpenCV
        img_enc = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    else:
        img_enc = img

    success, buf = cv2.imencode(fmt, img_enc)
    if not success:
        raise RuntimeError(f"cv2.imencode failed for format {fmt!r}")
    return base64.b64encode(buf).decode("utf-8")


def b64_to_numpy(b64_str: str) -> np.ndarray:
    """Decode a base64 image string back to a numpy array (BGR)."""
    buf = base64.b64decode(b64_str)
    arr = np.frombuffer(buf, np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_UNCHANGED)


def read_upload_bytes(raw_bytes: bytes) -> np.ndarray:
    """
    Decode raw upload bytes to a numpy array.
    Handles: JPEG, PNG, 8-bit TIFF, 16-bit TIFF (RISAT/Cartosat raw frames).

    Returns the decoded array as-is (dtype/channel count preserved);
    inference_engine.preprocess_ir_frame() normalises it downstream.
    """
    arr = np.frombuffer(raw_bytes, np.uint8)

    # Try OpenCV standard decode first
    img = cv2.imdecode(arr, cv2.IMREAD_UNCHANGED)
    if img is not None:
        return img

    # Fallback: PIL for multi-page or unusual TIFF
    try:
        from io import BytesIO
        from PIL import Image
        import numpy as _np
        pil_img = Image.open(BytesIO(raw_bytes))
        return _np.array(pil_img)
    except Exception as e:
        raise ValueError(f"Could not decode uploaded image: {e}") from e
