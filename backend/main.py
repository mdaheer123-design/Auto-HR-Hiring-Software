"""
Friday HR Platform — FastAPI Application Entry Point.
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import settings
from database import init_db
from routers import auth, jobs, applications, resumes, screening, chatbot, dashboard
from services.search_service import close_es
from services.retention_service import cleanup_old_applications
from apscheduler.schedulers.asyncio import AsyncIOScheduler

# Create global scheduler instance
scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """App startup/shutdown lifecycle."""
    # Startup
    print("[INFO] Friday HR Platform starting...")
    await init_db()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    print("[SUCCESS] Database initialized")
    print(f"[INFO] Upload directory: {os.path.abspath(settings.UPLOAD_DIR)}")

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
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(resumes.router)
app.include_router(screening.router)
app.include_router(chatbot.router)
app.include_router(dashboard.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=56060, reload=True)
