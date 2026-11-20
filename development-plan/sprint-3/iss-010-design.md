# Technical Design

- **ID:** `iss-010`
- **Date:** Nov 18, 2026
- **Title:** Restructure AI_CLIP as a production-ready FastAPI service
- **Branch:** `refactor/iss-010-ai-service-structure`

> Implementation plan: [./iss-010-plan.md](iss-010-plan.md)

## 1) Overview

### Context

`AI_CLIP` currently keeps the FastAPI application, model loading, inference, and request handling in `main.py`. Model and embedding assets sit beside the application code. This makes responsibilities hard to maintain and complicates configuration, startup failure handling, and future service changes.

The service exposes `GET /ping` and `POST /extract-vibes`. The backend depends on the latter, and the current Docker image runs on Hugging Face Spaces at port 7860.

### Proposed

Organize the service as a small Python package with separate API, configuration, and inference layers. Load settings from environment variables, initialize model resources once through FastAPI's lifespan, and expose readiness through the existing ping route. Keep inference synchronous in a service function and dispatch it to FastAPI's thread pool as today.

Move deployable model and catalog assets under a dedicated assets directory, while keeping the Docker build context and Hugging Face port behavior intact. Preserve both public routes, request and response shapes, upload limits, and current CLIP behavior.

Treat the restructure as a documentation change as well as a code change. Audit repository guides for paths, commands, environment variables, runtime ports, and architecture descriptions that become stale. Update only the affected sections and keep the AI service README as the detailed source for AI-specific setup.

### Goals

- Make HTTP handling, configuration, and model inference responsibilities clear.
- Fail startup with a useful error when required assets or model initialization are invalid.
- Keep one initialized model session and catalog per worker process.
- Preserve backend compatibility and the existing Hugging Face Spaces deployment.
- Make the source tree ready for focused unit tests without introducing a large framework.

### Non-Goals

- Changing endpoints, payloads, ranking behavior, or model architecture.
- Adding authentication, a database, a queue, or a second service.
- Building a model-training or asset-generation pipeline.
- Introducing a broad plugin architecture, repository layer, or unnecessary abstractions.
- Promising horizontal scaling or multi-worker tuning as part of this refactor.

## 2) Requirements and Constraints

- Keep `GET /ping` and `POST /extract-vibes` behavior and response contracts unchanged.
- Keep the 10 MB upload limit, image pixel limit, invalid-image responses, and top-10 result behavior.
- Configure model, embeddings, keywords, processor, and runtime options through environment-backed settings with current values as defaults.
- Resolve asset paths independently of the process working directory.
- Initialize resources once at application startup and release references on shutdown.
- Do not load large model files during module import.
- Keep model assets in the Docker build and preserve the Hugging Face Spaces port (`7860`).
- Use Python 3.10 for local and container runtime consistency.
- Use explicit, pinned Python dependency versions suitable for reproducible deployment.

## 3) Architecture and Components

```text
AI_CLIP/
├── app/
│   ├── main.py                 # FastAPI app factory and lifespan
│   ├── api/routes.py           # HTTP endpoints and request validation
│   ├── core/config.py          # Environment-backed settings
│   ├── core/logging.py         # Service logging setup
│   └── services/clip.py        # Model loading, catalog validation, inference
├── assets/
│   ├── models/                 # Deployable ONNX model
│   ├── catalog/                # Embeddings and keywords
│   └── clip_processor/         # Local tokenizer and processor files
├── scripts/                    # Offline asset/pipeline utilities, if retained
├── tests/                       # Focused service and API tests
├── Dockerfile
└── requirements.txt
```

`app.main` creates the application and uses an async lifespan handler to load a `ClipService`, store it in application state, and close it on shutdown. Routes validate and read uploads, then call the service through `run_in_threadpool`. The service owns ONNX Runtime initialization, catalog consistency checks, normalization, and ranking. Settings provide absolute asset paths based on the package/project root unless explicitly overridden by environment variables.

**Request lifecycle:**

```text
Process start → read settings → initialize processor, ONNX session, and catalog
  → validate catalog and warm the model → serve requests
  → /ping reports readiness → /extract-vibes validates image and runs inference
Process shutdown → release service references
```

`/ping` remains the existing lightweight probe and returns `{"status":"ok"}` when the service is ready. If readiness needs a stronger contract later, add a separate readiness route without changing this route's response.

## 4) Data, APIs, and Security

No database or API contract changes. Uploaded images remain size- and pixel-limited, decoded with Pillow, and converted to RGB before inference. Configuration must not log secrets. The Docker image continues to run as a non-root user where the Hugging Face runtime permits it; model assets are read-only at runtime.

## 5) Risks and Rollback

| Risk | Mitigation |
| --- | --- |
| Moving assets breaks relative paths in local or hosted runs. | Resolve defaults from the service root and allow environment overrides; verify the Docker image from its configured working directory. |
| Lifespan refactor delays startup or hides initialization errors. | Log initialization stages and fail startup with the failing asset or component identified. |
| Dependency pins differ from the current hosted environment. | Pin known-compatible versions and build the Docker image as part of implementation verification. |
| A module import path change breaks the container command. | Update the Docker command to the package entry point and verify the container startup contract. |

Rollback by restoring the original root-level `main.py`, asset paths, and Docker command. No data migration is required; asset moves are repository-only.

## 6) Documentation Updates

Update documentation whose instructions or examples are affected by the new package layout:

| Document | Planned update |
| --- | --- |
| `AI_CLIP/README.md` | Make this the canonical AI service guide: package tree, setup, environment variables, local run, assets, API probes, and Docker/Hugging Face deployment. |
| `AI_CLIP/AI_HOSTING_HF.md` | Refresh deployment paths and startup command for the package entry point; keep the 7860 port requirement accurate. |
| `AI_CLIP/scripts/pipeline.ipynb` | Update runtime asset references and direct generated models/catalogs to an ignored experimental output directory. |
| `docs/project-structure.md` | Update the AI_CLIP tree and short component descriptions. |
| `development-plan/sprint-2/iss-002-design.md` | Correct the catalog path/count and clarify that experimental notebook outputs require review before deployment. |
| `AGENTS.md` and `CLAUDE.md` | Update AI service paths, environment examples, install/run/build guidance, and entry-point references. Keep both guides aligned. |
| Root `README.md` | Update only AI service setup, environment, run command, Docker references, and repository tree/examples that name the old layout. |

Do not copy the full AI service guide into root or agent-instruction files. Avoid unrelated wording and historical sprint documents unless an active instruction there would otherwise be incorrect. If another repository document is found to encode an obsolete path or command, update it as part of the same audit.

## 7) References

- `AI_CLIP/app/main.py` - FastAPI application factory and managed startup lifecycle.
- `AI_CLIP/app/api/routes.py` - current FastAPI endpoints and image checks.
- `AI_CLIP/app/services/clip.py` - model initialization, catalog validation, and inference.
- `AI_CLIP/Dockerfile` - current Hugging Face Spaces image and port configuration.
- `AI_CLIP/requirements.txt` - current runtime dependencies.
- `backend/src/modules/vibe-scan/` - backend integration with the AI service.
