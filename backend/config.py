"""
Friday HR Platform — Configuration
Loads all environment variables from .env via Pydantic Settings.
"""
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional

# Resolve .env: check backend/ first, then project root (parent of backend/)
_this_dir = Path(__file__).resolve().parent
_env_file = _this_dir / ".env"
if not _env_file.exists():
    _env_file = _this_dir.parent / ".env"


class Settings(BaseSettings):
    # ── Auth ──
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440

    # ── Database ──
    DATABASE_URL: str = f"sqlite+aiosqlite:///{(_this_dir / 'friday.db').as_posix()}"

    # ── Resume Parser (Affinda / RChilli) ──
    AFFINDA_API_KEY: Optional[str] = None
    AFFINDA_WORKSPACE_ID: Optional[str] = None
    RCHILLI_API_KEY: Optional[str] = None
    RCHILLI_USER_KEY: Optional[str] = None

    # ── Embeddings (BGE-M3) ──
    BGE_M3_MODEL_PATH: str = "BAAI/bge-m3"

    # ── Elasticsearch ──
    ELASTICSEARCH_URL: str = "http://localhost:9200"
    ELASTICSEARCH_API_KEY: Optional[str] = None

    # ── AI Screening (Gemini) ──
    GEMINI_API_KEY: Optional[str] = None

    # ── Chatbot (Groq) ──
    GROQ_API_KEY: Optional[str] = None

    # ── Email — SendGrid ──
    SENDGRID_API_KEY: Optional[str] = None

    # ── Email — SMTP fallback ──
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "noreply@fridayhr.com"

    # ── File Storage ──
    UPLOAD_DIR: str = "./uploads"

    # ── Auto Cleanup Job ──
    AUTO_CLEANUP_ENABLED: bool = True
    AUTO_CLEANUP_DAYS: int = 7
    AUTO_PURGE_DAYS: int = 90

    # ── AWS (optional) ──
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET: Optional[str] = None

    class Config:
        env_file = str(_env_file)
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
