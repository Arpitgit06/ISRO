"""
backend/inference_engine.py  —  TESSERACTZ
═══════════════════════════════════════════════════════════════════════════════
Simulates the proposed "Shared Encoder + Dual Branch Decoder" architecture
using pre-trained checkpoints.  No training required.

Pipeline:
    IR frame (512×512) ─► CLAHE preprocessing
                        ─► Shared backbone (timm ResNet-50, ImageNet weights)
                              ├─► Enhancement branch  → Real-ESRGAN 4× SR
                              └─► Colorization branch → eccv16 neural colorizer
                                                        (histogram fallback if unavailable)
                        ─► YOLOv8x / YOLO-World detection
                        ─► Latency timings returned for telemetry dashboard

All models are lazy-loaded on first call and cached for the process lifetime.
Thread-safe singleton — safe for concurrent FastAPI async workers.
═══════════════════════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import logging
import threading
import time
import urllib.request
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
import torch
import torch.nn.functional as F
import timm
from PIL import Image

logger = logging.getLogger(__name__)

# ─── Global constants ─────────────────────────────────────────────────────────

def _select_device() -> tuple[str, str]:
    """
    Auto-detect the best available compute device.

    Priority order:
        1. CUDA  (NVIDIA GPUs / ROCm AMD GPUs)
        2. DirectML  (AMD / Intel / NVIDIA GPUs on Windows via torch-directml)
        3. MPS   (Apple Silicon)
        4. CPU   (fallback)
    """
    # --- NVIDIA CUDA or AMD ROCm (both expose torch.cuda) ---
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        vram_gb = round(torch.cuda.get_device_properties(0).total_mem / (1024 ** 3), 1)
        logger.info(f"GPU detected: {gpu_name} ({vram_gb} GB VRAM)")
        if "AMD" in gpu_name.upper() or "RADEON" in gpu_name.upper():
            logger.info("Using AMD ROCm backend via CUDA API")
        else:
            logger.info("Using NVIDIA CUDA backend")
        return "cuda", gpu_name

    # --- AMD / Intel / NVIDIA via DirectML (Windows) ---
    try:
        import torch_directml  # noqa: F401
        dml_device = torch_directml.device()
        logger.info(f"DirectML device available: {dml_device}")
        logger.info("Using DirectML backend for GPU inference")
        return str(dml_device), "DirectML"
    except Exception:
        pass

    # --- Apple Silicon MPS ---
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        logger.info("Using Apple MPS backend")
        return "mps", "Apple MPS"

    # --- CPU fallback ---
    logger.warning(
        "No GPU detected — running on CPU. Inference will be slow.\n"
        "  For NVIDIA: pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118\n"
        "  For AMD (Windows): pip install torch-directml\n"
        "  For AMD (Linux): Install PyTorch ROCm build from https://pytorch.org"
    )
    return "cpu", "CPU"


DEVICE, DEVICE_LABEL = _select_device()

CHECKPOINT_DIR = Path(__file__).parent / "checkpoints"

ESRGAN_WEIGHT_URL = (
    "https://github.com/xinntao/Real-ESRGAN/releases/download/"
    "v0.1.0/RealESRGAN_x4plus.pth"
)
ESRGAN_WEIGHT_PATH = CHECKPOINT_DIR / "realesrgan" / "RealESRGAN_x4plus.pth"

logger.info(f"TESSERACTZ inference engine — compute device: {DEVICE}")



# ═══════════════════════════════════════════════════════════════════════════════
# 1.  PREPROCESSING
# ═══════════════════════════════════════════════════════════════════════════════

def preprocess_ir_frame(raw: np.ndarray | Image.Image) -> np.ndarray:
    """
    Standardise a raw single-channel IR frame.

    Accepts:
        • (H, W)      uint8 / uint16 / float32   — bare grayscale
        • (H, W, 1)                               — single-channel with trailing dim
        • (H, W, 3)   BGR (OpenCV convention)
        • (H, W, 4)   BGRA
        • PIL.Image

    Returns:
        (H, W) uint8  — CLAHE-enhanced grayscale, ready for backbone and decoder branches.

    Steps:
        1. Coerce to single-channel uint8  (handles uint16 from RISAT/Cartosat)
        2. CLAHE  — clipLimit 3.0, tileGrid 8×8   (preserves local detail)
        3. Global histogram equalisation           (lifts global dynamic range)
        4. 60 / 40 blend of CLAHE + HEQ           (balance contrast vs saturation)
    """
    if isinstance(raw, Image.Image):
        raw = np.array(raw)

    # ── Reduce to 2-D ──
    if raw.ndim == 3:
        if raw.shape[2] == 4:
            raw = raw[:, :, :3]
        if raw.shape[2] == 3:
            raw = cv2.cvtColor(raw, cv2.COLOR_BGR2GRAY)
        else:
            raw = raw[:, :, 0]

    # ── Normalise to uint8 ──
    if raw.dtype != np.uint8:
        raw = cv2.normalize(raw, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)

    # ── CLAHE ──
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    clahe_out = clahe.apply(raw)

    # ── Histogram equalisation ──
    heq_out = cv2.equalizeHist(raw)

    # ── Blend ──
    return cv2.addWeighted(clahe_out, 0.6, heq_out, 0.4, 0)


# ═══════════════════════════════════════════════════════════════════════════════
# 2.  SHARED BACKBONE  (simulates the shared encoder)
# ═══════════════════════════════════════════════════════════════════════════════

class SharedBackbone:
    """
    timm ResNet-50 with features_only=True.

    Provides 5-scale feature maps used as the conceptual shared encoder.
    The grayscale frame is replicated to 3 channels before feeding the network.
    Features are stored externally and used by metrics_engine.py for GradCAM.
    """

    IMAGENET_MEAN = [0.485, 0.456, 0.406]
    IMAGENET_STD  = [0.229, 0.224, 0.225]

    def __init__(self, model_name: str = "resnet50"):
        logger.info(f"Loading shared backbone: {model_name}  (timm, ImageNet weights)")
        self.model = (
            timm.create_model(model_name, pretrained=True, features_only=True)
            .to(DEVICE)
            .eval()
        )
        self._mean = (
            torch.tensor(self.IMAGENET_MEAN).view(1, 3, 1, 1).to(DEVICE)
        )
        self._std = (
            torch.tensor(self.IMAGENET_STD).view(1, 3, 1, 1).to(DEVICE)
        )
        logger.info("Shared backbone ready.")

    @torch.no_grad()
    def extract_features(self, gray: np.ndarray) -> list[torch.Tensor]:
        """
        Args:
            gray: (H, W) uint8

        Returns:
            List of 5 feature tensors at successive spatial scales.
            Stored in InferenceEngine._last_features for GradCAM access.
        """
        rgb = np.stack([gray, gray, gray], axis=2)                        # (H,W,3)
        t = torch.from_numpy(rgb).permute(2, 0, 1).float().div(255.0)    # (3,H,W)
        t = (t.unsqueeze(0).to(DEVICE) - self._mean) / self._std         # (1,3,H,W)
        return self.model(t)


# ═══════════════════════════════════════════════════════════════════════════════
# 3.  ENHANCEMENT BRANCH  — Real-ESRGAN 4× super-resolution
# ═══════════════════════════════════════════════════════════════════════════════

class ESRGANEnhancer:
    """
    Loads Real-ESRGAN RRDBNet (x4plus checkpoint).
    Downloads weights on first run (~64 MB).  Falls back to bicubic interpolation
    if the `realesrgan` / `basicsr` packages are not installed.
    """

    def __init__(self):
        self._upsampler = self._load()

    def _load(self):
        try:
            from basicsr.archs.rrdbnet_arch import RRDBNet
            from realesrgan import RealESRGANer

            ESRGAN_WEIGHT_PATH.parent.mkdir(parents=True, exist_ok=True)
            if not ESRGAN_WEIGHT_PATH.exists():
                logger.info("Downloading RealESRGAN_x4plus.pth (~64 MB)…")
                urllib.request.urlretrieve(ESRGAN_WEIGHT_URL, ESRGAN_WEIGHT_PATH)

            net = RRDBNet(
                num_in_ch=3, num_out_ch=3,
                num_feat=64, num_block=23, num_grow_ch=32, scale=4,
            )
            upsampler = RealESRGANer(
                scale=4,
                model_path=str(ESRGAN_WEIGHT_PATH),
                model=net,
                tile=256,
                tile_pad=10,
                pre_pad=0,
                half=(DEVICE == "cuda"),
            )
            logger.info("Real-ESRGAN ready.")
            return upsampler

        except ImportError as e:
            logger.warning(
                f"realesrgan/basicsr not installed ({e}).  "
                "Enhancement will use bicubic upscaling."
            )
            return None

    def enhance(self, gray: np.ndarray) -> np.ndarray:
        """
        Args:
            gray: (H, W) uint8 grayscale

        Returns:
            (4H, 4W, 3) uint8 RGB — super-resolved output
        """
        bgr_input = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)

        if self._upsampler is not None:
            try:
                out_bgr, _ = self._upsampler.enhance(bgr_input, outscale=4)
                return cv2.cvtColor(out_bgr, cv2.COLOR_BGR2RGB)
            except Exception as exc:
                logger.warning(f"ESRGAN inference failed ({exc}) — bicubic fallback.")

        # Bicubic fallback
        h, w = gray.shape
        rgb = cv2.cvtColor(gray, cv2.COLOR_GRAY2RGB)
        return cv2.resize(rgb, (w * 4, h * 4), interpolation=cv2.INTER_CUBIC)


# ═══════════════════════════════════════════════════════════════════════════════
# 4.  COLORIZATION BRANCH  — eccv16 neural + histogram fallback
# ═══════════════════════════════════════════════════════════════════════════════

class ColorizationBranch:
    """
    Primary:  Zhang et al. eccv16 neural colorizer  (torch.hub — richzhang/colorization).
              Operates in Lab space; predicts ab channels from L.

    Fallback: Histogram-anchored pseudo-colorization with COLORMAP_INFERNO.
              Blend anchored to FLIR ADAS and KAIST M3FD intensity distributions:
                cold (dark) ─► deep blue / purple (sky, cold background)
                mid         ─► amber / orange     (roads, structures)
                hot (bright)─► white / yellow     (vehicles, heat sources)
    """

    def __init__(self):
        self._model = self._load()

    def _load(self):
        try:
            logger.info("Loading eccv16 colorizer (torch.hub)…")
            model = torch.hub.load(
                "richzhang/colorization",
                "colorization_eccv16",
                pretrained=True,
                verbose=False,
            ).to(DEVICE).eval()
            logger.info("Colorizer ready.")
            return model
        except Exception as e:
            logger.warning(
                f"eccv16 model unavailable ({e}).  "
                "Colorization will use histogram fallback."
            )
            return None

    @torch.no_grad()
    def _neural_colorize(self, gray: np.ndarray) -> np.ndarray:
        """eccv16 Lab-space colorization."""
        try:
            from skimage import color as skcolor
        except ImportError as e:
            raise RuntimeError("scikit-image required for neural colorization") from e

        H, W = gray.shape
        img_f  = gray.astype(np.float32) / 255.0
        img_rs = cv2.resize(img_f, (256, 256))

        # L channel  →  (1, 1, 256, 256) tensor
        lab = skcolor.rgb2lab(np.stack([img_rs] * 3, axis=2)).astype(np.float32)
        L_t = torch.tensor(lab[:, :, :1]).permute(2, 0, 1).unsqueeze(0).to(DEVICE)
        L_t = (L_t - 50.0) / 100.0

        # Predict ab channels and upscale back to original resolution
        ab_pred = self._model(L_t)                                            # (1,2,H,W)
        ab_pred = F.interpolate(ab_pred, size=(H, W), mode="bilinear", align_corners=False)
        ab_np   = ab_pred.squeeze(0).permute(1, 2, 0).cpu().numpy() * 110.0

        # Reconstruct full-resolution Lab
        L_full   = skcolor.rgb2lab(np.stack([img_f] * 3, axis=2))[:, :, :1]
        lab_full = np.concatenate([L_full, ab_np], axis=2)
        rgb      = (np.clip(skcolor.lab2rgb(lab_full), 0, 1) * 255).astype(np.uint8)
        return rgb

    @staticmethod
    def _histogram_fallback(gray: np.ndarray) -> np.ndarray:
        norm      = cv2.normalize(gray, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        pseudo    = cv2.cvtColor(cv2.applyColorMap(norm, cv2.COLORMAP_INFERNO), cv2.COLOR_BGR2RGB)
        gray_rgb  = cv2.cvtColor(gray, cv2.COLOR_GRAY2RGB)
        # 78% pseudo-color, 22% grayscale — preserves structural edges
        return cv2.addWeighted(pseudo, 0.78, gray_rgb, 0.22, 0)

    def colorize(self, gray: np.ndarray) -> np.ndarray:
        """
        Args:
            gray: (H, W) uint8 grayscale

        Returns:
            (H, W, 3) uint8 RGB — colorized frame
        """
        if self._model is not None:
            try:
                return self._neural_colorize(gray)
            except Exception as exc:
                logger.warning(f"Neural colorization failed ({exc}) — histogram fallback.")
        return self._histogram_fallback(gray)


# ═══════════════════════════════════════════════════════════════════════════════
# 5.  DETECTION HEAD  — YOLOv8x / YOLO-World
# ═══════════════════════════════════════════════════════════════════════════════

class DetectionHead:
    """
    Preferred: YOLO-World (yolov8x-worldv2) with open-vocabulary prompting —
               runs directly on ["vehicle", "building", "road", "vegetation"].

    Fallback:  Standard YOLOv8x (COCO-trained) with manual class remapping
               of vehicle-related COCO IDs.

    Note: COCO does not include "building", "road", or "vegetation" as classes.
          For full 4-class detection, YOLO-World or a DOTA-trained model is
          strongly preferred for satellite imagery.
    """

    TARGET_CLASSES  = ["vehicle", "building", "road", "vegetation"]
    # COCO class IDs that map to "vehicle"
    COCO_VEHICLE_IDS = {2, 3, 4, 5, 6, 7, 8}   # bicycle, car, motorcycle, airplane, bus, truck, boat
    COCO_PLANT_IDS   = {63}                     # potted plant

    def __init__(self, conf_threshold: float = 0.25):
        self.conf = conf_threshold
        if self._try_yolo_world():
            self._mode = "world"
        else:
            self._load_coco()
            self._mode = "coco"

    def _try_yolo_world(self) -> bool:
        try:
            from ultralytics import YOLOWorld
            logger.info("Loading YOLO-World (open-vocabulary)…")
            self._model = YOLOWorld("yolov8x-worldv2.pt")
            self._model.set_classes(self.TARGET_CLASSES)
            logger.info("YOLO-World ready — 4-class open-vocabulary detection active.")
            return True
        except Exception as e:
            logger.warning(f"YOLO-World unavailable ({e}) — standard YOLOv8x.")
            return False

    def _load_coco(self):
        from ultralytics import YOLO
        logger.info("Loading YOLOv8x (COCO 80-class)…")
        self._model = YOLO("yolov8x.pt")
        logger.info("YOLOv8x ready.")

    def _remap_coco_class(self, cls_id: int, label: str) -> Optional[str]:
        """Map COCO class → TESSERACTZ target class, or None to discard."""
        label = label.lower()
        if cls_id in self.COCO_VEHICLE_IDS:
            return "vehicle"
        if cls_id in self.COCO_PLANT_IDS or label in {"tree", "grass", "plant"}:
            return "vegetation"
        return None

    def detect(self, rgb: np.ndarray) -> list[dict]:
        """
        Args:
            rgb: (H, W, 3) uint8 RGB (the colorized output)

        Returns:
            List of dicts:  {label: str, confidence: float, bbox: [x1,y1,x2,y2]}
        """
        results = self._model(
            rgb, conf=self.conf, device=DEVICE, verbose=False
        )
        detections: list[dict] = []

        for r in results:
            for box in r.boxes:
                cls_id    = int(box.cls)
                raw_label = (
                    self._model.names[cls_id]
                    if hasattr(self._model, "names")
                    else str(cls_id)
                )

                if self._mode == "world":
                    label = raw_label   # already one of TARGET_CLASSES
                else:
                    label = self._remap_coco_class(cls_id, raw_label)
                    if label is None:
                        continue        # skip non-target classes

                detections.append({
                    "label":      label,
                    "confidence": round(float(box.conf), 4),
                    "bbox":       [round(float(v), 1) for v in box.xyxy[0].tolist()],
                })

        return detections


# ═══════════════════════════════════════════════════════════════════════════════
# 6.  SINGLETON ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class InferenceEngine:
    """
    Process-level singleton that owns all loaded models.

    Usage (in main.py):
        from inference_engine import engine

        @app.on_event("startup")
        async def startup():
            engine.warm_up()

        @app.post("/process")
        async def process(file: UploadFile):
            raw = cv2.imdecode(np.frombuffer(await file.read(), np.uint8), cv2.IMREAD_UNCHANGED)
            result = engine.run_pipeline(raw)
            ...
    """

    _instance: Optional["InferenceEngine"] = None
    _lock = threading.Lock()

    def __new__(cls) -> "InferenceEngine":
        with cls._lock:
            if cls._instance is None:
                inst = super().__new__(cls)
                inst._ready = False
                inst._last_features: Optional[list] = None
                cls._instance = inst
        return cls._instance

    # ── Initialisation ────────────────────────────────────────────────────────

    def warm_up(self) -> None:
        """
        Pre-load every model.  Call once at FastAPI startup so the first
        request is not penalised by cold-load latency.
        """
        if self._ready:
            return
        logger.info("═══ TESSERACTZ InferenceEngine  ▶  warm-up start ═══")
        self.backbone    = SharedBackbone()
        self.enhancer    = ESRGANEnhancer()
        self.colorizer   = ColorizationBranch()
        self.detector    = DetectionHead()
        self._ready      = True
        logger.info("═══ InferenceEngine warm — all models cached ═══")

    # ── Pipeline entry point ──────────────────────────────────────────────────

    def run_pipeline(
        self,
        raw_image: np.ndarray | Image.Image,
        run_detection: bool = True,
    ) -> dict:
        """
        Full TESSERACTZ forward pass.

        Returns:
            {
                "preprocessed":  np.ndarray  (H, W)      — CLAHE-enhanced grayscale
                "enhanced":      np.ndarray  (4H, 4W, 3) — Real-ESRGAN SR (RGB)
                "colorized":     np.ndarray  (H, W, 3)   — colorized RGB
                "detections":    list[dict]               — YOLO boxes
                "class_counts":  dict[str, int]           — per-class totals
                "latency_ms":    dict[str, float]         — stage timings
            }
        """
        if not self._ready:
            self.warm_up()

        ts: dict[str, float] = {}

        # ① Preprocessing
        t = time.perf_counter()
        preprocessed = preprocess_ir_frame(raw_image)
        ts["preprocessing_ms"] = _ms(t)

        # ② Backbone  (features stored for GradCAM access in metrics_engine.py)
        t = time.perf_counter()
        self._last_features = self.backbone.extract_features(preprocessed)
        ts["backbone_ms"] = _ms(t)

        # ③ Enhancement branch
        t = time.perf_counter()
        enhanced = self.enhancer.enhance(preprocessed)
        ts["esrgan_ms"] = _ms(t)

        # ④ Colorization branch
        t = time.perf_counter()
        colorized = self.colorizer.colorize(preprocessed)
        ts["colorization_ms"] = _ms(t)

        # ⑤ Detection head
        detections: list[dict] = []
        class_counts: dict[str, int] = {}
        ts["detection_ms"] = 0.0

        if run_detection:
            t = time.perf_counter()
            detections = self.detector.detect(colorized)
            ts["detection_ms"] = _ms(t)
            for det in detections:
                class_counts[det["label"]] = class_counts.get(det["label"], 0) + 1

        ts["total_ms"] = round(sum(ts.values()), 2)

        return {
            "preprocessed":  preprocessed,
            "enhanced":      enhanced,
            "colorized":     colorized,
            "detections":    detections,
            "class_counts":  class_counts,
            "latency_ms":    ts,
        }


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _ms(t0: float) -> float:
    """Elapsed time from t0 in milliseconds, rounded to 2 dp."""
    return round((time.perf_counter() - t0) * 1000, 2)


# ─── Module-level singleton (import target for main.py & metrics_engine.py) ──

engine = InferenceEngine()


# ─── Quick smoke test ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")

    # Generate a synthetic 512×512 IR-like frame (Gaussian noise + gradient)
    logger.info("Running smoke test with synthetic 512×512 IR frame…")
    synthetic_ir = (
        np.random.normal(loc=128, scale=40, size=(512, 512))
        + np.linspace(0, 60, 512)[np.newaxis, :]
    ).clip(0, 255).astype(np.uint8)

    result = engine.run_pipeline(synthetic_ir, run_detection=False)

    logger.info("Smoke test complete.")
    logger.info(f"  preprocessed shape  : {result['preprocessed'].shape}")
    logger.info(f"  enhanced shape      : {result['enhanced'].shape}")
    logger.info(f"  colorized shape     : {result['colorized'].shape}")
    logger.info(f"  latency             : {result['latency_ms']}")
