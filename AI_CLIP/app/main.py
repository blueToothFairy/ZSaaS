"""FastAPI application factory and managed model lifecycle."""

from contextlib import asynccontextmanager
import logging
from collections.abc import AsyncIterator

from fastapi import FastAPI

from app.api.routes import router
from app.core.config import Settings
from app.core.logging import configure_logging
from app.services.clip import ClipService

logger = logging.getLogger(__name__)


def create_app(settings: Settings | None = None) -> FastAPI:
    app_settings = settings or Settings()
    configure_logging(app_settings.log_level)

    @asynccontextmanager
    async def lifespan(application: FastAPI) -> AsyncIterator[None]:
        application.state.settings = app_settings
        application.state.clip_service = None
        try:
            logger.info("Initializing CLIP model and assets")
            application.state.clip_service = ClipService.load(app_settings)
        except Exception:
            logger.exception("AI service startup failed")
            raise
        try:
            yield
        finally:
            application.state.clip_service = None
            logger.info("AI service resources released")

    application = FastAPI(title="VibeTune AI", lifespan=lifespan)
    application.include_router(router)
    return application


app = create_app()
