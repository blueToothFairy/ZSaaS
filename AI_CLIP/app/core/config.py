"""Environment-backed application settings."""

from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

SERVICE_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=SERVICE_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    model_path: Path = SERVICE_ROOT / "assets" / "models" / "clip_vision_512.onnx"
    text_emb_path: Path = SERVICE_ROOT / "assets" / "catalog" / "vibe_embeddings.npy"
    keywords_path: Path = SERVICE_ROOT / "assets" / "catalog" / "vibe_keywords.npy"
    clip_processor_path: Path = SERVICE_ROOT / "assets" / "clip_processor"
    max_upload_bytes: int = 10 * 1024 * 1024
    max_image_pixels: int = 25_000_000
    log_level: str = "INFO"
    intra_op_num_threads: int = Field(default=1, ge=1)
    inter_op_num_threads: int = Field(default=1, ge=1)

    @field_validator("model_path", "text_emb_path", "keywords_path", "clip_processor_path", mode="before")
    @classmethod
    def resolve_asset_paths(cls, value: str | Path) -> Path:
        path = Path(value).expanduser()
        return path if path.is_absolute() else SERVICE_ROOT / path

    @field_validator("max_upload_bytes", "max_image_pixels")
    @classmethod
    def validate_positive_limits(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("Image limits must be positive")
        return value

    @field_validator("log_level")
    @classmethod
    def normalize_log_level(cls, value: str) -> str:
        normalized = value.upper()
        if normalized not in {"CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG"}:
            raise ValueError("LOG_LEVEL must be CRITICAL, ERROR, WARNING, INFO, or DEBUG")
        return normalized
