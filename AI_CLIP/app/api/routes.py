"""HTTP endpoints for image vibe extraction."""

from __future__ import annotations

import io
import logging

from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from PIL import Image
from starlette.concurrency import run_in_threadpool

from app.services.clip import ClipService

logger = logging.getLogger(__name__)
router = APIRouter()


def get_clip_service(request: Request) -> ClipService:
    service = getattr(request.app.state, "clip_service", None)
    if service is None:
        raise HTTPException(status_code=503, detail="Image model is not ready")
    return service


@router.get("/ping")
async def ping(request: Request) -> dict[str, str]:
    """Lightweight health probe used by keep-alive pings."""
    get_clip_service(request)
    return {"status": "ok"}


@router.post("/extract-vibes")
async def extract_vibes(
    request: Request,
    file: UploadFile = File(...),
) -> dict[str, list[dict[str, str | float]]]:
    settings = request.app.state.settings
    contents = await file.read(settings.max_upload_bytes + 1)
    await file.close()
    if len(contents) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="Image must be 10 MB or smaller")

    try:
        with Image.open(io.BytesIO(contents)) as source:
            if source.width * source.height > settings.max_image_pixels:
                raise HTTPException(status_code=413, detail="Image dimensions are too large")
            source.verify()
        with Image.open(io.BytesIO(contents)) as source:
            image = source.convert("RGB")
    except HTTPException:
        raise
    except (Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise HTTPException(status_code=413, detail="Image dimensions are too large") from None
    except Exception as error:
        logger.info("Rejected invalid image upload: %s", type(error).__name__)
        raise HTTPException(status_code=400, detail="Invalid image") from None

    service = get_clip_service(request)
    return await run_in_threadpool(service.infer, image)
