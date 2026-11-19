"""CLIP ONNX model loading and image-to-vibe inference."""

from __future__ import annotations

import logging
from dataclasses import dataclass

import numpy as np
import onnxruntime as ort
from PIL import Image
from transformers import CLIPProcessor

from app.core.config import Settings

logger = logging.getLogger(__name__)
EMBEDDING_DIMENSIONS = 512
RESULT_LIMIT = 10


def load_catalog(embeddings_path: str, keywords_path: str) -> tuple[np.ndarray, np.ndarray]:
    text_matrix = np.load(embeddings_path, allow_pickle=False)
    keywords = np.load(keywords_path, allow_pickle=False)

    if text_matrix.ndim != 2 or text_matrix.shape[1] != EMBEDDING_DIMENSIONS:
        raise ValueError(
            f"Text embeddings must have shape (N, {EMBEDDING_DIMENSIONS}); "
            f"received {text_matrix.shape}"
        )
    if text_matrix.shape[0] == 0:
        raise ValueError("Text embedding catalog must contain at least one row")
    if not np.issubdtype(text_matrix.dtype, np.number) or not np.isfinite(text_matrix).all():
        raise ValueError("Text embeddings must contain finite numeric values")
    if keywords.ndim != 1:
        raise ValueError(f"Keyword catalog must be one-dimensional; received {keywords.shape}")
    if len(keywords) < text_matrix.shape[0]:
        raise ValueError(
            f"Keyword catalog has {len(keywords)} labels but "
            f"{text_matrix.shape[0]} text embeddings"
        )
    if len(keywords) > text_matrix.shape[0]:
        logger.warning(
            "Keyword catalog has %s labels but only %s embeddings; ignoring unmatched labels",
            len(keywords),
            text_matrix.shape[0],
        )
        keywords = keywords[: text_matrix.shape[0]]

    text_matrix = text_matrix.astype(np.float32, copy=False)
    norms = np.linalg.norm(text_matrix, axis=1, keepdims=True)
    if not np.isfinite(norms).all() or np.any(norms == 0):
        raise ValueError("Text embeddings must have non-zero finite norms")
    return text_matrix / norms, keywords


@dataclass
class ClipService:
    session: ort.InferenceSession
    processor: CLIPProcessor
    text_matrix: np.ndarray
    keywords: np.ndarray

    @classmethod
    def load(cls, settings: Settings) -> "ClipService":
        for asset_path in (
            settings.model_path,
            settings.text_emb_path,
            settings.keywords_path,
            settings.clip_processor_path,
        ):
            if not asset_path.exists():
                raise FileNotFoundError(f"Required AI service asset not found: {asset_path}")

        session_options = ort.SessionOptions()
        session_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        session_options.intra_op_num_threads = settings.intra_op_num_threads
        session_options.inter_op_num_threads = settings.inter_op_num_threads
        session_options.enable_mem_pattern = False
        session_options.enable_cpu_mem_arena = False

        session = ort.InferenceSession(
            str(settings.model_path),
            sess_options=session_options,
            providers=["CPUExecutionProvider"],
        )
        processor = CLIPProcessor.from_pretrained(
            str(settings.clip_processor_path),
            local_files_only=True,
        )
        text_matrix, keywords = load_catalog(str(settings.text_emb_path), str(settings.keywords_path))

        service = cls(session=session, processor=processor, text_matrix=text_matrix, keywords=keywords)
        dummy = np.zeros((1, 3, 224, 224), dtype=np.float32)
        session.run(None, {"pixel_values": dummy})
        logger.info("CLIP service ready with %s text embeddings", text_matrix.shape[0])
        return service

    def infer(self, image: Image.Image) -> dict[str, list[dict[str, str | float]]]:
        inputs = self.processor(images=image, return_tensors="np")
        image_embedding = self.session.run(
            ["image_embeddings"],
            {"pixel_values": inputs["pixel_values"]},
        )[0]

        norm = np.linalg.norm(image_embedding, axis=1, keepdims=True)
        if not np.isfinite(norm).all() or np.any(norm == 0):
            raise RuntimeError("Image embedding could not be calculated")
        image_embedding = image_embedding / norm
        scores = image_embedding @ self.text_matrix.T
        top_indices = np.argsort(-scores[0])[:RESULT_LIMIT]
        return {
            "top_keywords": [
                {"keyword": str(self.keywords[index]), "score": float(scores[0][index])}
                for index in top_indices
            ]
        }
