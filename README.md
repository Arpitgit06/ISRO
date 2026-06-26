# TESSERACTZ 🛰️

**IR Image Colorization & Enhancement Mission Hub** — Bharatiya Antariksh Hackathon

TESSERACTZ is a full-stack AI application that processes raw infrared satellite imagery through a multi-stage deep learning pipeline: preprocessing → super-resolution enhancement → neural colorization → object detection → quality metrics.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React + Tailwind CSS)  — port 3000               │
│  ┌─────────┐  ┌─────────────┐  ┌──────────────────┐        │
│  │ Upload  │→ │ Image Slider│→ │ Telemetry Panel  │        │
│  │  Zone   │  │ (before/    │  │ (PSNR/SSIM/LPIPS │        │
│  │         │  │  after)     │  │  + GradCAM)      │        │
│  └─────────┘  └─────────────┘  └──────────────────┘        │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API (fetch + XHR upload)
┌──────────────────────▼──────────────────────────────────────┐
│  Backend (FastAPI + Uvicorn)  — port 8000                    │
│  ┌──────────────┐  ┌────────────┐  ┌──────────────┐        │
│  │ Inference    │  │ Metrics    │  │ Image Utils  │        │
│  │ Engine       │  │ Engine     │  │              │        │
│  │ (ResNet50 +  │  │ (PSNR,    │  │ (decode,     │        │
│  │  RealESRGAN  │  │  SSIM,    │  │  encode,     │        │
│  │  + eccv16    │  │  LPIPS,   │  │  normalize)  │        │
│  │  + YOLOv8)   │  │  GradCAM) │  │              │        │
│  └──────────────┘  └────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

| Requirement    | Minimum Version | Notes                                                                 |
|----------------|----------------|-----------------------------------------------------------------------|
| **Python**     | 3.10+          | Required for PyTorch 2.2+                                             |
| **Node.js**    | 18+            | LTS recommended                                                       |
| **npm**        | 9+             | Bundled with Node.js                                                  |
| **Git**        | 2.30+          | For cloning and version control                                       |
| **GPU (opt.)** | NVIDIA / AMD    | CUDA 11.8+, DirectML, or ROCm recommended; CPU works but is slower    |

---

## 🚀 Quickstart

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/tesseractz.git
cd tesseractz
```

### 2. Install Dependencies

**Automated (Recommended on Windows):**
```batch
install.bat
```

**Manual:**
```bash
# Backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

# Frontend
npm install
```

### 3. Launch the System

**Automated (Windows):**
```batch
start.bat
```

**Manual:**
```bash
# Terminal 1 — Backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — Frontend
npm start
```

### 4. Open in Browser

| Service       | URL                           |
|---------------|-------------------------------|
| **Frontend**  | http://localhost:3000          |
| **Backend**   | http://localhost:8000          |
| **API Docs**  | http://localhost:8000/docs     |

---

## 📁 Project Structure

```
ISRO/
│
├── main.py                 # FastAPI entry point
├── inference_engine.py     # Multi-stage ML pipeline (ResNet50, RealESRGAN, eccv16, YOLOv8)
├── metrics_engine.py       # PSNR / SSIM / LPIPS / GradCAM computation
├── schemas/
│   ├── __init__.py
│   └── response_schemas.py # Pydantic response models
├── utils/
│   ├── __init__.py
│   └── image_utils.py      # Image encoding / decoding helpers
├── requirements.txt        # Python dependencies
│
├── package.json            # Node.js / React dependencies
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS plugins (Tailwind + Autoprefixer)
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── index.js            # React entry point
│   ├── index.css           # Tailwind directives
│   ├── App.jsx             # Root component (global styles + layout)
│   ├── components/
│   │   ├── Dashboard.jsx       # Main layout & orchestration
│   │   ├── UploadZone.jsx      # Drag-and-drop image upload
│   │   ├── ImageSlider.jsx     # Before/after comparison slider
│   │   ├── TelemetryPanel.jsx  # Metrics dashboard (charts + stats)
│   │   ├── ControlBar.jsx      # Processing controls & status
│   │   └── OverlayCanvas.jsx   # YOLO detection overlay
│   ├── hooks/
│   │   ├── useInference.js     # Inference API hook
│   │   └── useOverlay.js       # Canvas overlay hook
│   ├── services/
│   │   └── api.js              # Backend API client (fetch + XHR)
│   └── store/
│       └── useAppStore.js      # Zustand state management
│
├── Dockerfile              # Backend Docker image
├── docker-compose.yml      # Multi-container orchestration
│
├── install.bat             # One-click installation (Windows)
├── start.bat               # Launch backend + frontend (Windows)
├── clean.bat               # Remove all installed deps (Windows)
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

---

## 🔧 Scripts Reference

| Script          | Purpose                                                        |
|-----------------|----------------------------------------------------------------|
| `install.bat`   | Checks prerequisites, creates venv, installs all dependencies  |
| `start.bat`     | Launches backend and frontend in separate windows              |
| `clean.bat`     | Removes `node_modules`, `.venv`, `__pycache__`, `checkpoints`  |

---

## 🌐 API Endpoints

| Method | Endpoint        | Description                               |
|--------|----------------|-------------------------------------------|
| GET    | `/`            | Root info endpoint                        |
| GET    | `/api/health`  | Liveness + readiness probe (device, models) |
| POST   | `/api/process` | Full inference pipeline (upload IR image)  |
| GET    | `/docs`        | Interactive Swagger API documentation      |

### Example: Process an Image

```bash
curl -X POST http://localhost:8000/api/process \
  -F "file=@path/to/ir_image.tif" \
  -F "run_detection=true"
```

**Response includes:**
- Base64-encoded images: `raw`, `preprocessed`, `enhanced`, `colorized`, `gradcam`
- YOLO detection boxes with class labels
- Quality metrics: PSNR, SSIM, LPIPS
- Per-stage latency timings

---

## 🐳 Docker Deployment

```bash
# Build and run both services
docker compose up --build

# With GPU support (requires nvidia-container-toolkit)
# Uncomment `runtime: nvidia` in docker-compose.yml first
docker compose up --build
```

---

## 🧠 ML Pipeline Stages

| Stage             | Model / Method           | Purpose                         |
|-------------------|--------------------------|---------------------------------|
| **Preprocessing** | CLAHE + bilateral filter | Noise reduction & contrast      |
| **Enhancement**   | Real-ESRGAN x4plus       | 4× super-resolution upscaling  |
| **Colorization**  | eccv16 neural network    | Grayscale → natural color       |
| **Detection**     | YOLOv8                   | Object detection & bounding boxes |
| **Explainability**| GradCAM (ResNet50)       | Visual attention heatmaps       |
| **Metrics**       | PSNR, SSIM, LPIPS        | Image quality assessment        |

---

## 🔍 Troubleshooting

### `react-scripts is not recognized`
```batch
:: node_modules may be corrupt. Clean and reinstall:
clean.bat
install.bat
```

### `ModuleNotFoundError: No module named 'schemas'`
Run `main.py` from the project root directory (`d:\ISRO\`), not from a subdirectory.

### GPU not detected
```bash
# NVIDIA CUDA (Windows / Linux)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# AMD Windows (DirectML)
pip install -U torch-directml

# AMD Linux (ROCm)
# Follow the official PyTorch ROCm install instructions at https://pytorch.org
```
The app falls back to CPU mode automatically — inference will be slower but functional.

### Port already in use
```batch
netstat -ano | findstr :3000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Fresh Start
```batch
:: Remove everything and reinstall from scratch
clean.bat
install.bat
```

---

## 👥 Team

Built for the **Bharatiya Antariksh Hackathon** by **Team TESSERACTZ**.

---

## 📄 License

This project was developed as part of the Bharatiya Antariksh Hackathon.
