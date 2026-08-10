"""
Search service — Elasticsearch indexing and hybrid search (BM25 + kNN via RRF).
Manages the friday_resumes index for candidate-JD matching.
"""
from typing import Optional
from config import settings

_es_client = None
INDEX_NAME = "friday_resumes"
EMBEDDING_DIM = 1024


async def _get_es():
    """Get or create async Elasticsearch client."""
    global _es_client

    if _es_client is not None:
        return _es_client

    try:
        from elasticsearch import AsyncElasticsearch

        es_kwargs = {
            "hosts": [settings.ELASTICSEARCH_URL],
            "verify_certs": False,
        }
        if settings.ELASTICSEARCH_API_KEY:
            es_kwargs["api_key"] = settings.ELASTICSEARCH_API_KEY

        _es_client = AsyncElasticsearch(**es_kwargs)

        # Create index if not exists
        if not await _es_client.indices.exists(index=INDEX_NAME):
            await _es_client.indices.create(
                index=INDEX_NAME,
                body={
                    "settings": {
                        "number_of_shards": 1,
                        "number_of_replicas": 0,
                    },
                    "mappings": {
                        "properties": {
                            "resume_id": {"type": "integer"},
                            "user_id": {"type": "integer"},
                            "raw_text": {"type": "text", "analyzer": "standard"},
                            "embedding": {
                                "type": "dense_vector",
                                "dims": EMBEDDING_DIM,
                                "index": True,
                                "similarity": "cosine",
                            },
                            "name": {"type": "text"},
                            "email": {"type": "keyword"},
                            "skills": {"type": "text"},
                        }
                    },
                },
            )
            print(f"[INFO] Created Elasticsearch index: {INDEX_NAME}")

        return _es_client

    except Exception as e:
        print(f"[WARN] Elasticsearch connection failed: {e}")
        return None


async def index_resume(
    resume_id: int,
    user_id: int,
    raw_text: str,
    embedding: list[float],
    name: str = "",
    email: str = "",
    skills: str = "",
):
    """Index a resume document in Elasticsearch."""
    es = await _get_es()
    if es is None:
        print("[WARN] Elasticsearch not available — skipping indexing")
        return

    doc = {
        "resume_id": resume_id,
        "user_id": user_id,
        "raw_text": raw_text[:10000],  # Limit stored text
        "embedding": embedding,
        "name": name,
        "email": email,
        "skills": skills or "",
    }

    await es.index(
        index=INDEX_NAME,
        id=str(resume_id),
        body=doc,
    )
    print(f"[INFO] Indexed resume {resume_id} in Elasticsearch")


async def hybrid_search(
    query_text: str,
    query_embedding: list[float],
    k: int = 20,
    filters: Optional[dict] = None,
) -> list[dict]:
    """
    Hybrid search combining BM25 text search and kNN vector search
    via Reciprocal Rank Fusion (RRF).
    """
    es = await _get_es()
    if es is None:
        return []

    try:
        # Build the hybrid query using RRF retriever
        body = {
            "retriever": {
                "rrf": {
                    "retrievers": [
                        {
                            "standard": {
                                "query": {
                                    "multi_match": {
                                        "query": query_text,
                                        "fields": ["raw_text^2", "skills^3", "name"],
                                    }
                                }
                            }
                        },
                        {
                            "knn": {
                                "field": "embedding",
                                "query_vector": query_embedding,
                                "k": k,
                                "num_candidates": k * 5,
                            }
                        },
                    ]
                }
            },
            "size": k,
            "_source": ["resume_id", "user_id", "name", "email", "skills", "raw_text"],
        }

        result = await es.search(index=INDEX_NAME, body=body)

        hits = []
        for hit in result["hits"]["hits"]:
            source = hit["_source"]
            source["_score"] = hit.get("_score", 0)
            hits.append(source)

        return hits

    except Exception as e:
        print(f"[WARN] Hybrid search failed, falling back to BM25: {e}")
        # Fallback to BM25 only
        try:
            result = await es.search(
                index=INDEX_NAME,
                body={
                    "query": {
                        "multi_match": {
                            "query": query_text,
                            "fields": ["raw_text", "skills", "name"],
                        }
                    },
                    "size": k,
                    "_source": ["resume_id", "user_id", "name", "email", "skills"],
                },
            )
            return [
                {**hit["_source"], "_score": hit.get("_score", 0)}
                for hit in result["hits"]["hits"]
            ]
        except Exception as e2:
            print(f"[WARN] BM25 fallback also failed: {e2}")
            return []


async def search_candidates_for_role(query: str, k: int = 20) -> list[dict]:
    """
    Search for candidates matching a role/query string.
    Used by the HR chatbot for grounded context retrieval.
    """
    es = await _get_es()
    if es is None:
        return []

    try:
        result = await es.search(
            index=INDEX_NAME,
            body={
                "query": {
                    "multi_match": {
                        "query": query,
                        "fields": ["raw_text^2", "skills^3", "name"],
                        "fuzziness": "AUTO",
                    }
                },
                "size": k,
                "_source": ["resume_id", "user_id", "name", "email", "skills", "raw_text"],
            },
        )
        return [
            {**hit["_source"], "_score": hit.get("_score", 0)}
            for hit in result["hits"]["hits"]
        ]
    except Exception as e:
        print(f"[WARN] Candidate search failed: {e}")
        return []


async def close_es():
    """Close Elasticsearch client on app shutdown."""
    global _es_client
    if _es_client:
        await _es_client.close()
        _es_client = None


async def delete_resume_from_index(resume_id: int):
    """Delete a resume document from Elasticsearch."""
    es = await _get_es()
    if es is None:
        print("[WARN] Elasticsearch not available — skipping delete")
        return

    try:
        await es.delete(index=INDEX_NAME, id=str(resume_id), ignore=[404])
        print(f"[INFO] Deleted resume {resume_id} from Elasticsearch index")
    except Exception as e:
        print(f"[WARN] Failed to delete resume {resume_id} from Elasticsearch: {e}")
