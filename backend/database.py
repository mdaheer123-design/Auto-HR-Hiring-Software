"""
Friday HR Platform — Database Engine & Session
Supports SQLite (dev) and PostgreSQL (prod) via DATABASE_URL.
"""
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from config import settings


# ── Build the async engine ──
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False},
    )
else:
    # PostgreSQL (asyncpg)
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    engine = create_async_engine(db_url, echo=False)

# ── Session factory ──
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


# ── Base model ──
class Base(DeclarativeBase):
    pass


# ── Dependency ──
async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


# ── Init tables ──
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        # SQLite lightweight column migrations for added fields
        if settings.DATABASE_URL.startswith("sqlite"):
            try:
                from sqlalchemy import text
                migrations = [
                    "ALTER TABLE applications ADD COLUMN interview_time DATETIME;",
                    "ALTER TABLE applications ADD COLUMN interview_link VARCHAR(255);",
                    "ALTER TABLE applications ADD COLUMN email_sent INTEGER DEFAULT 0;",
                    "ALTER TABLE jobs ADD COLUMN responsibilities TEXT;",
                    "ALTER TABLE jobs ADD COLUMN highlights TEXT;"
                ]
                for query in migrations:
                    try:
                        await conn.execute(text(query))
                    except Exception:
                        pass
            except Exception as e:
                print(f"[INFO] Migration note: {e}")
