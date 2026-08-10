"""
Embedding service — BGE-M3 embeddings via sentence-transformers.
Generates dense vectors for resume text and job descriptions.
Falls back to a simple TF-IDF-based vector if model unavailable.
"""
import asyncio
from typing import Optional

_model = None
_model_loading = False

EMBEDDING_DIM = 1024
MODEL_NAME = "BAAI/bge-m3"


def _get_model():
    """Lazy-load the BGE-M3 model as a singleton."""
    global _model, _model_loading

    if _model is not None:
        return _model

    if _model_loading:
        return None

    _model_loading = True
    try:
        from sentence_transformers import SentenceTransformer
        print(f"[INFO] Loading embedding model: {MODEL_NAME}...")
        _model = SentenceTransformer(MODEL_NAME)
        print(f"[INFO] Embedding model loaded successfully.")
        return _model
    except Exception as e:
        print(f"[WARN] Could not load embedding model: {e}")
        _model_loading = False
        return None


async def generate_embedding(text: str) -> list[float]:
    """
    Generate a dense embedding vector for the given text.
    Uses BGE-M3 if available, otherwise returns a zero vector.
    """
    # Truncate very long texts
    text = text[:8000]

    model = _get_model()

    if model is not None:
        # Run in thread pool to avoid blocking async event loop
        loop = asyncio.get_event_loop()
        embedding = await loop.run_in_executor(
            None,
            lambda: model.encode(text, normalize_embeddings=True).tolist()
        )
        return embedding
    else:
        # Fallback: return zero vector (search will rely on BM25 only)
        print("[WARN] Using zero vector — BGE-M3 model not available")
        return [0.0] * EMBEDDING_DIM


async def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a batch of texts."""
    model = _get_model()

    if model is not None:
        truncated = [t[:8000] for t in texts]
        loop = asyncio.get_event_loop()
        embeddings = await loop.run_in_executor(
            None,
            lambda: model.encode(truncated, normalize_embeddings=True).tolist()
        )
        return embeddings
    else:
        return [[0.0] * EMBEDDING_DIM for _ in texts]
