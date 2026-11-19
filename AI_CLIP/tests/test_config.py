from pathlib import Path

import pytest

from app.core.config import SERVICE_ROOT, Settings


def test_default_asset_paths_are_rooted_at_service_directory() -> None:
    settings = Settings(_env_file=None)

    assert settings.model_path == SERVICE_ROOT / "assets" / "models" / "clip_vision_512.onnx"
    assert settings.text_emb_path == SERVICE_ROOT / "assets" / "catalog" / "vibe_embeddings.npy"
    assert settings.keywords_path == SERVICE_ROOT / "assets" / "catalog" / "vibe_keywords.npy"
    assert settings.clip_processor_path == SERVICE_ROOT / "assets" / "clip_processor"


def test_asset_path_can_be_overridden_by_environment(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    model_path = tmp_path / "custom.onnx"
    monkeypatch.setenv("MODEL_PATH", str(model_path))

    assert Settings(_env_file=None).model_path == model_path


@pytest.mark.parametrize("value", ["0", "-1"])
def test_non_positive_image_limits_are_rejected(value: str) -> None:
    with pytest.raises(ValueError):
        Settings(_env_file=None, max_upload_bytes=int(value))
