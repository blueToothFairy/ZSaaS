from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image
import pytest

from app.core.config import Settings
from app.main import create_app
from app.services.clip import ClipService


class FakeClipService:
    def infer(self, image: Image.Image) -> dict[str, list[dict[str, str | float]]]:
        return {"top_keywords": [{"keyword": "calm", "score": 0.9}]}


def make_png(width: int = 8, height: int = 8) -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (width, height)).save(buffer, format="PNG")
    return buffer.getvalue()


def install_fake_service(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        ClipService,
        "load",
        classmethod(lambda cls, settings: FakeClipService()),
    )


def test_ping_reports_ready_service(monkeypatch: pytest.MonkeyPatch) -> None:
    install_fake_service(monkeypatch)
    app = create_app(Settings(_env_file=None))
    with TestClient(app) as client:
        assert client.get("/ping").json() == {"status": "ok"}


def test_extract_vibes_returns_existing_response_shape(monkeypatch: pytest.MonkeyPatch) -> None:
    install_fake_service(monkeypatch)
    app = create_app(Settings(_env_file=None))
    with TestClient(app) as client:
        response = client.post("/extract-vibes", files={"file": ("image.png", make_png(), "image/png")})
        assert response.status_code == 200
        assert response.json() == {"top_keywords": [{"keyword": "calm", "score": 0.9}]}


def test_extract_vibes_rejects_invalid_image(monkeypatch: pytest.MonkeyPatch) -> None:
    install_fake_service(monkeypatch)
    app = create_app(Settings(_env_file=None))
    with TestClient(app) as client:
        response = client.post("/extract-vibes", files={"file": ("image.bin", b"not an image")})
        assert response.status_code == 400
        assert response.json() == {"detail": "Invalid image"}


def test_extract_vibes_rejects_oversized_upload(monkeypatch: pytest.MonkeyPatch) -> None:
    install_fake_service(monkeypatch)
    app = create_app(Settings(_env_file=None, max_upload_bytes=8))
    with TestClient(app) as client:
        response = client.post("/extract-vibes", files={"file": ("image.png", make_png())})
        assert response.status_code == 413


def test_extract_vibes_rejects_excessive_image_dimensions(monkeypatch: pytest.MonkeyPatch) -> None:
    install_fake_service(monkeypatch)
    app = create_app(Settings(_env_file=None, max_image_pixels=16))
    with TestClient(app) as client:
        response = client.post(
            "/extract-vibes",
            files={"file": ("image.png", make_png(8, 8), "image/png")},
        )
        assert response.status_code == 413
        assert response.json() == {"detail": "Image dimensions are too large"}


def test_ping_returns_service_unavailable_without_model(monkeypatch: pytest.MonkeyPatch) -> None:
    install_fake_service(monkeypatch)
    app = create_app(Settings(_env_file=None))
    with TestClient(app) as client:
        client.app.state.clip_service = None
        response = client.get("/ping")
        assert response.status_code == 503
