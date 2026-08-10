"""
HR Dashboard router — Aggregated stats and pipeline metrics.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from datetime import datetime, timedelta, timezone

from database import get_db
from models.user import User
from models.job import Job
from models.application import Application
from middleware.auth import require_hr

router = APIRouter(prefix="/api/hr", tags=["HR Dashboard"])


@router.get("/dashboard")
async def get_dashboard_stats(
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregated HR dashboard statistics."""
    # Total open jobs
    open_jobs_result = await db.execute(
        select(func.count()).select_from(Job).where(Job.status == "open")
    )
    total_open_jobs = open_jobs_result.scalar() or 0

    # Total candidates
    candidates_result = await db.execute(
        select(func.count()).select_from(User).where(User.role == "candidate")
    )
    total_candidates = candidates_result.scalar() or 0

    # Total applications
    total_apps_result = await db.execute(
        select(func.count()).select_from(Application)
    )
    total_applications = total_apps_result.scalar() or 0

    # This week's applications
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    week_apps_result = await db.execute(
        select(func.count()).select_from(Application).where(
            Application.applied_at >= week_ago
        )
    )
    this_week_applications = week_apps_result.scalar() or 0

    # Pipeline breakdown — count per status
    pipeline_result = await db.execute(
        select(Application.status, func.count()).group_by(Application.status)
    )
    pipeline = {row[0]: row[1] for row in pipeline_result.all()}

    pipeline_stats = {
        "applied": pipeline.get("applied", 0),
        "screening": pipeline.get("screening", 0),
        "shortlisted": pipeline.get("shortlisted", 0),
        "interview": pipeline.get("interview", 0),
        "selected": pipeline.get("selected", 0),
        "rejected": pipeline.get("rejected", 0),
    }

    # Per-job application counts (top 10 by applicant count)
    job_stats_result = await db.execute(
        select(
            Job.id,
            Job.title,
            Job.status,
            func.count(Application.id).label("app_count"),
        )
        .outerjoin(Application, Application.job_id == Job.id)
        .group_by(Job.id, Job.title, Job.status)
        .order_by(func.count(Application.id).desc())
        .limit(10)
    )
    job_stats = [
        {"id": row.id, "title": row.title, "status": row.status, "application_count": row.app_count}
        for row in job_stats_result.all()
    ]

    # Recent applications (last 10)
    recent_result = await db.execute(
        select(Application)
        .order_by(Application.applied_at.desc())
        .limit(10)
    )
    recent_apps = recent_result.scalars().all()

    recent_applications = []
    for app in recent_apps:
        candidate_result = await db.execute(
            select(User.full_name, User.email).where(User.id == app.user_id)
        )
        candidate = candidate_result.one_or_none()

        job_result = await db.execute(
            select(Job.title).where(Job.id == app.job_id)
        )
        job_title = job_result.scalar()

        recent_applications.append({
            "id": app.id,
            "candidate_name": candidate.full_name if candidate else "Unknown",
            "candidate_email": candidate.email if candidate else "",
            "job_title": job_title or "",
            "status": app.status,
            "ai_score": app.ai_score,
            "applied_at": app.applied_at.isoformat() if app.applied_at else None,
        })

    return {
        "total_open_jobs": total_open_jobs,
        "total_candidates": total_candidates,
        "total_applications": total_applications,
        "this_week_applications": this_week_applications,
        "pipeline": pipeline_stats,
        "job_stats": job_stats,
        "recent_applications": recent_applications,
    }
