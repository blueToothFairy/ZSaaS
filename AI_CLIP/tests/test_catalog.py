import numpy as np
import pytest

from app.services.clip import load_catalog


def test_catalog_normalizes_vectors_and_truncates_unmatched_labels(tmp_path) -> None:
    embedding_path = tmp_path / "embeddings.npy"
    keyword_path = tmp_path / "keywords.npy"
    np.save(embedding_path, np.array([[3.0] + [0.0] * 511], dtype=np.float32))
    np.save(keyword_path, np.array(["matched", "unmatched"]))

    matrix, keywords = load_catalog(str(embedding_path), str(keyword_path))

    assert matrix.shape == (1, 512)
    assert np.linalg.norm(matrix[0]) == pytest.approx(1.0)
    assert keywords.tolist() == ["matched"]


def test_catalog_rejects_fewer_labels_than_embeddings(tmp_path) -> None:
    embedding_path = tmp_path / "embeddings.npy"
    keyword_path = tmp_path / "keywords.npy"
    np.save(embedding_path, np.ones((2, 512), dtype=np.float32))
    np.save(keyword_path, np.array(["one-label"]))

    with pytest.raises(ValueError, match="has 1 labels but 2 text embeddings"):
        load_catalog(str(embedding_path), str(keyword_path))


def test_catalog_rejects_invalid_embedding_shape(tmp_path) -> None:
    embedding_path = tmp_path / "embeddings.npy"
    keyword_path = tmp_path / "keywords.npy"
    np.save(embedding_path, np.ones((2, 256), dtype=np.float32))
    np.save(keyword_path, np.array(["one", "two"]))

    with pytest.raises(ValueError, match=r"shape \(N, 512\)"):
        load_catalog(str(embedding_path), str(keyword_path))


def test_catalog_rejects_empty_embedding_matrix(tmp_path) -> None:
    embedding_path = tmp_path / "embeddings.npy"
    keyword_path = tmp_path / "keywords.npy"
    np.save(embedding_path, np.empty((0, 512), dtype=np.float32))
    np.save(keyword_path, np.array([], dtype=str))

    with pytest.raises(ValueError, match="at least one row"):
        load_catalog(str(embedding_path), str(keyword_path))
