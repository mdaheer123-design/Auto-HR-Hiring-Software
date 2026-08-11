"""
Friday HR Platform — FastAPI Application Entry Point.
"""
import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from config import settings
from database import init_db
from routers import auth, jobs, applications, resumes, screening, chatbot, dashboard
from services.search_service import close_es
from services.retention_service import cleanup_old_applications
from apscheduler.schedulers.asyncio import AsyncIOScheduler

# Create global scheduler instance
scheduler = AsyncIOScheduler()

# Path to frontend build output
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"

@asynccontextmanager
async def lifespan(app: FastAPI):
    """App startup/shutdown lifecycle."""
    # Startup
    print("[INFO] Friday HR Platform starting...")
    await init_db()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    print("[SUCCESS] Database initialized")
    print(f"[INFO] Upload directory: {os.path.abspath(settings.UPLOAD_DIR)}")
    print(f"[INFO] Frontend dist: {FRONTEND_DIST} (exists={FRONTEND_DIST.exists()})")

    # Start APScheduler for background tasks
    scheduler.add_job(cleanup_old_applications, 'interval', hours=1, id='cleanup_job')
    scheduler.start()
    print("[INFO] Background task scheduler started.")

    yield

    # Shutdown
    scheduler.shutdown()
    await close_es()
    print("[INFO] Friday HR Platform shutting down")


app = FastAPI(
    title="Friday HR Platform",
    description="AI-powered HR hiring platform with resume screening and chatbot",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(resumes.router)
app.include_router(screening.router)
app.include_router(chatbot.router)
app.include_router(dashboard.router)

# Serve React frontend static files (production build)
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="static-assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Serve React SPA — any non-API route returns index.html."""
        file_path = FRONTEND_DIST / full_path
        if full_path and file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(FRONTEND_DIST / "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=56060, reload=True)
