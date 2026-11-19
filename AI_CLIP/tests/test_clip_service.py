import numpy as np
import pytest
from PIL import Image

from app.services.clip import ClipService


class FakeProcessor:
    def __call__(self, *, images: Image.Image, return_tensors: str) -> dict[str, np.ndarray]:
        assert return_tensors == "np"
        return {"pixel_values": np.zeros((1, 3, 224, 224), dtype=np.float32)}


class FakeSession:
    def __init__(self, embedding: np.ndarray) -> None:
        self.embedding = embedding

    def run(self, outputs: list[str], inputs: dict[str, np.ndarray]) -> list[np.ndarray]:
        assert outputs == ["image_embeddings"]
        assert "pixel_values" in inputs
        return [self.embedding]


def test_inference_returns_sorted_top_ten_results() -> None:
    keywords = np.array([f"vibe-{index}" for index in range(12)])
    text_matrix = np.zeros((12, 512), dtype=np.float32)
    text_matrix[np.arange(12), np.arange(12)] = 1
    image_embedding = np.zeros((1, 512), dtype=np.float32)
    image_embedding[0, :12] = np.arange(1, 13)
    service = ClipService(
        session=FakeSession(image_embedding),  # type: ignore[arg-type]
        processor=FakeProcessor(),  # type: ignore[arg-type]
        text_matrix=text_matrix,
        keywords=keywords,
    )

    result = service.infer(Image.new("RGB", (8, 8)))

    assert len(result["top_keywords"]) == 10
    assert result["top_keywords"][0]["keyword"] == "vibe-11"
    assert result["top_keywords"][-1]["keyword"] == "vibe-2"


def test_inference_rejects_zero_length_image_embedding() -> None:
    service = ClipService(
        session=FakeSession(np.zeros((1, 512), dtype=np.float32)),  # type: ignore[arg-type]
        processor=FakeProcessor(),  # type: ignore[arg-type]
        text_matrix=np.ones((1, 512), dtype=np.float32),
        keywords=np.array(["calm"]),
    )

    with pytest.raises(RuntimeError, match="Image embedding"):
        service.infer(Image.new("RGB", (8, 8)))
