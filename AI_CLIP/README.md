---
title: VibeTune AI
emoji: 🎵
colorFrom: purple
colorTo: pink
sdk: docker
pinned: false
---

# VibeTune AI Service

FastAPI service that maps an uploaded image to the closest VibeTune vibe keywords using a CLIP ONNX vision model.

## Project Layout

```text
AI_CLIP/
├── app/
│   ├── main.py                 # FastAPI application factory and lifespan
│   ├── api/routes.py           # HTTP routes and upload validation
│   ├── core/                   # Settings and logging
│   └── services/clip.py        # ONNX session, catalog validation, inference
├── assets/
│   ├── models/                 # ONNX model variants
│   ├── catalog/                # Vibe embeddings and keyword labels
│   └── clip_processor/         # Local CLIP preprocessing/tokenizer files
├── scripts/                    # Offline pipeline notes and experiments
├── tests/                       # Unit and API tests
├── Dockerfile
├── requirements.txt
└── requirements-dev.txt
```

## Requirements and Setup

- Python 3.10
- The required model, catalog, and processor assets listed below

Create and activate a virtual environment from `AI_CLIP/`, then install dependencies:

```bash
python -m venv .venv
# macOS/Linux
source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

The service reads settings from environment variables and an optional `AI_CLIP/.env` file. Defaults point to the assets included in this repository.

| Variable | Default | Description |
| --- | --- | --- |
| `MODEL_PATH` | `assets/models/clip_vision_512.onnx` | ONNX vision model path |
| `TEXT_EMB_PATH` | `assets/catalog/vibe_embeddings.npy` | Precomputed text embedding matrix |
| `KEYWORDS_PATH` | `assets/catalog/vibe_keywords.npy` | Labels corresponding to embedding rows |
| `CLIP_PROCESSOR_PATH` | `assets/clip_processor` | Local CLIP processor files |
| `MAX_UPLOAD_BYTES` | `10485760` | Maximum upload size (10 MiB) |
| `MAX_IMAGE_PIXELS` | `25000000` | Maximum decoded image dimensions |
| `LOG_LEVEL` | `INFO` | `CRITICAL`, `ERROR`, `WARNING`, `INFO`, or `DEBUG` |
| `INTRA_OP_NUM_THREADS` | `1` | ONNX Runtime intra-op threads |
| `INTER_OP_NUM_THREADS` | `1` | ONNX Runtime inter-op threads |

Relative asset paths are resolved from the `AI_CLIP/` directory, regardless of the process working directory.

## Run Locally

From `AI_CLIP/` with the virtual environment active:

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

On startup, the service validates the assets, initializes the CPU ONNX session, normalizes the embedding catalog, and warms up the model. Missing or malformed assets stop startup and are reported in the logs.

## API

- `GET /ping` returns `{"status":"ok"}` when the model is ready.
- `POST /extract-vibes` accepts one multipart image field named `file` and returns:

```json
{
  "top_keywords": [
    {"keyword": "sunset beach", "score": 0.42}
  ]
}
```

The endpoint returns `400` for invalid images, `413` for files over 10 MiB or images over the pixel limit, and `503` when the model is unavailable. OpenAPI documentation is available at `/docs`.

## Assets

The runtime requires:

- `assets/models/clip_vision_512.onnx`
- `assets/catalog/vibe_embeddings.npy`
- `assets/catalog/vibe_keywords.npy`
- `assets/clip_processor/` files

Alternative ONNX model files are retained for experiments but are not copied into the production Docker image. The notebook writes generated models and catalogs to the ignored `scripts/artifacts/` directory so experiments cannot overwrite deployed assets. Keep keyword row order aligned with embedding row order; unmatched trailing labels are ignored, while missing labels or invalid vectors stop startup.

## Tests

Install development dependencies and run focused checks:

```bash
python -m pip install -r requirements-dev.txt
python -m pytest
```

Tests use small fixtures and mocked model inference; the production ONNX model is not loaded by the test suite.

When opening `scripts/pipeline.ipynb`, start Jupyter with `AI_CLIP/` as the working directory so its paths resolve to the `assets/` directories.

## Docker and Hugging Face Spaces

Build and run from `AI_CLIP/`:

```bash
docker build -t vibetune-ai .
docker run --rm -p 7860:7860 vibetune-ai
```

The image runs as a non-root user, uses only the required model variant, and listens on port `7860` for Hugging Face Spaces. See [AI_HOSTING_HF.md](AI_HOSTING_HF.md) for deployment steps.
