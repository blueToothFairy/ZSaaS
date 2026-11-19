# Implementation Plan

- **ID:** `iss-010`
- **Date:** Nov 18, 2026
- **Title:** Restructure AI_CLIP as a production-ready FastAPI service
- **Design:** [./iss-010-design.md](iss-010-design.md)
- **Scope:** Reorganize the AI service into a maintainable FastAPI package while preserving its API and hosted deployment.

## 1) Objective

Separate HTTP, configuration, and CLIP inference responsibilities; make startup and asset loading predictable; preserve current API and Hugging Face Spaces behavior.

## 2) Tasks

### Task 1 - Create the Service Package

- [x] Add `app/main.py` with an application factory and lifespan-managed service initialization.
- [x] Add `app/api/routes.py` for `/ping` and `/extract-vibes`.
- [x] Add `app/core/config.py` for environment-backed settings and root-relative asset defaults.
- [x] Add `app/core/logging.py` for concise structured service logs.
- [x] Keep model loading out of import time and store the initialized service on application state.

**Expected result:** Importing the package is lightweight; starting the app initializes dependencies once and fails clearly if initialization is invalid.

### Task 2 - Isolate CLIP Runtime and Organize Assets

- [x] Move ONNX model, embeddings, keywords, and local processor files into the documented `assets/` subdirectories.
- [x] Implement `app/services/clip.py` for session creation, catalog validation, normalization, warmup, and inference.
- [x] Preserve CPU execution settings and current top-10 cosine-similarity ranking.
- [x] Configure all asset paths and upload/image limits through settings with current behavior as defaults.
- [x] Keep notebooks and offline utilities separate from runtime imports; place them under `scripts/` or an appropriate development-only location.
- [x] Update notebook input paths to use the new `assets/models/` and `assets/catalog/` locations.
- [x] Keep notebook-generated outputs under an ignored experimental directory so model/catalog experiments cannot overwrite deployed assets.

**Expected result:** Runtime logic has a single owner, and assets load correctly regardless of the caller's working directory.

### Task 3 - Preserve API and Deployment Contracts

- [x] Keep `/ping`, `/extract-vibes`, response shapes, status codes, 10 MB limit, and image pixel limit unchanged.
- [x] Update `Dockerfile` to copy the package and required assets and start the new app import path.
- [x] Preserve Hugging Face Spaces port 7860 and document local run configuration.
- [x] Pin direct Python runtime dependencies to compatible versions.
- [x] Update `AI_CLIP/README.md` with the package layout, required assets, environment settings, and run commands.

**Expected result:** Existing backend integration and hosted deployment continue to work with the reorganized source tree.

### Task 4 - Audit and Update Project Documentation

- [x] Update `AI_CLIP/AI_HOSTING_HF.md` for the new entry point, asset paths, Docker workflow, and required Hugging Face port.
- [x] Update `docs/project-structure.md` to show the reorganized AI_CLIP package and asset tree.
- [x] Correct the catalog paths/count and notebook generation guidance in the related ISS-002 design notes.
- [x] Update `AGENTS.md` and `CLAUDE.md` AI service references, commands, and environment examples; keep their guidance consistent.
- [x] Update affected AI service sections in the root `README.md`, including setup, environment, local run, Docker references, examples, and the repository tree.
- [x] Search documentation and development notebooks for remaining references to obsolete AI service paths or commands and update applicable maintained files.
- [x] Keep the AI service README as the detailed setup guide; avoid duplicating its full content in project-wide guides.

**Expected result:** Maintained documentation gives consistent, runnable instructions for the new layout and no longer directs contributors to obsolete paths.

### Task 5 - Verify Startup and Inference Behavior

- [x] Add focused tests for settings/path resolution, catalog validation, and inference result shape using small fixtures or mocked ONNX dependencies.
- [x] Verify API behavior for valid uploads, invalid images, oversized files, excessive pixel dimensions, and unavailable service state.
- [x] Build and launch the Docker image with the expected port and asset layout.
- [x] Confirm the output remains `{"top_keywords":[{"keyword":...,"score":...}]}` with at most ten results.

**Expected result:** The refactor preserves externally visible behavior and catches missing or malformed assets during startup.

**Verification record:** `python -m pytest -q` passes (16 tests). The Docker image builds with the pinned runtime requirements, starts as user `vibetune` on port 7860, returns `{"status":"ok"}` from `/ping`, and completes a real image request with ten `top_keywords` results.

## 3) Acceptance Criteria

- FastAPI code is organized into API, core configuration, and inference service modules.
- Model resources initialize once during application lifespan and are not loaded on import.
- Asset paths work independently of the process working directory and can be overridden by environment variables.
- `/ping` and `/extract-vibes` retain their current paths, request/response contracts, and image limits.
- Docker retains Hugging Face Spaces compatibility on port 7860 and includes all required runtime assets.
- Dependency versions are pinned and the service setup is documented.
- `AI_CLIP/README.md`, `AI_HOSTING_HF.md`, `docs/project-structure.md`, `AGENTS.md`, `CLAUDE.md`, and affected root `README.md` sections reflect the new paths and commands.
- A repository search finds no active maintained documentation instructing users to start the AI service through the obsolete module path or use obsolete asset locations.
- Focused checks cover startup validation and the important API input cases.

## 4) Out of Scope

- API versioning, authentication, rate limiting, and response schema redesign.
- Model retraining, conversion, quantization, or quality changes.
- GPU support, distributed inference, and multi-worker capacity tuning.
- Moving deployment to a different hosting provider.
