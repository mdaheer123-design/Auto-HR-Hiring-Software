"""
Applications router — Apply to jobs, track status, HR candidate table.
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from database import get_db
from models.user import User
from models.job import Job
from models.application import Application
from models.resume import Resume
from schemas.application import (
    ApplicationCreateRequest,
    ApplicationStatusUpdate,
    ApplicationResponse,
)
from middleware.auth import get_current_user, require_hr, require_candidate
from services.email_service import send_selection_email

router = APIRouter(prefix="/api/applications", tags=["Applications"])


@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_to_job(
    request: ApplicationCreateRequest,
    current_user: User = Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Apply to a job (Candidate only)."""
    # Check job exists and is open
    job_result = await db.execute(select(Job).where(Job.id == request.job_id))
    job = job_result.scalar_one_or_none()
    if not job or job.status != "open":
        raise HTTPException(status_code=404, detail="Job not found or not open")

    # Check if already applied
    existing = await db.execute(
        select(Application).where(
            Application.user_id == current_user.id,
            Application.job_id == request.job_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already applied to this job")

    # Get latest resume if not specified
    resume_id = request.resume_id
    if not resume_id:
        resume_result = await db.execute(
            select(Resume)
            .where(Resume.user_id == current_user.id)
            .order_by(Resume.created_at.desc())
            .limit(1)
        )
        latest_resume = resume_result.scalar_one_or_none()
        if latest_resume:
            resume_id = latest_resume.id

    application = Application(
        user_id=current_user.id,
        job_id=request.job_id,
        resume_id=resume_id,
        status="applied",
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)

    return ApplicationResponse(
        **{c.name: getattr(application, c.name) for c in application.__table__.columns},
        candidate_name=current_user.full_name,
        candidate_email=current_user.email,
        job_title=job.title,
    )


@router.get("/me", response_model=list[ApplicationResponse])
async def get_my_applications(
    current_user: User = Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Get candidate's own applications with status."""
    result = await db.execute(
        select(Application)
        .where(Application.user_id == current_user.id)
        .order_by(Application.applied_at.desc())
    )
    applications = result.scalars().all()

    responses = []
    for app in applications:
        job_result = await db.execute(select(Job.title).where(Job.id == app.job_id))
        job_title = job_result.scalar()

        resume_name = None
        if app.resume_id:
            resume_result = await db.execute(select(Resume.file_name).where(Resume.id == app.resume_id))
            resume_name = resume_result.scalar()

        responses.append(ApplicationResponse(
            **{c.name: getattr(app, c.name) for c in app.__table__.columns},
            candidate_name=current_user.full_name,
            candidate_email=current_user.email,
            job_title=job_title,
            resume_file_name=resume_name,
        ))

    return responses


@router.get("/job/{job_id}", response_model=dict)
async def get_candidates_for_job(
    job_id: int,
    status_filter: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db),
):
    """Get candidate table for a specific job (HR only)."""
    # Verify job exists
    job_result = await db.execute(select(Job).where(Job.id == job_id))
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    stmt = select(Application).where(Application.job_id == job_id)
    if status_filter:
        stmt = stmt.where(Application.status == status_filter)

    # Count
    count_result = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = count_result.scalar()

    # Paginate
    stmt = stmt.order_by(Application.ai_score.desc().nullslast(), Application.applied_at.desc())
    stmt = stmt.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(stmt)
    applications = result.scalars().all()

    responses = []
    for app in applications:
        user_result = await db.execute(select(User).where(User.id == app.user_id))
        candidate = user_result.scalar_one_or_none()

        resume_name = None
        if app.resume_id:
            resume_result = await db.execute(select(Resume.file_name).where(Resume.id == app.resume_id))
            resume_name = resume_result.scalar()

        responses.append(ApplicationResponse(
            **{c.name: getattr(app, c.name) for c in app.__table__.columns},
            candidate_name=candidate.full_name if candidate else "Unknown",
            candidate_email=candidate.email if candidate else "",
            job_title=job.title,
            resume_file_name=resume_name,
        ))

    return {
        "applications": [r.model_dump() for r in responses],
        "total": total,
        "page": page,
        "per_page": per_page,
        "job_title": job.title,
    }


@router.patch("/{application_id}/status", response_model=ApplicationResponse)
async def update_application_status(
    application_id: int,
    request: ApplicationStatusUpdate,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db),
):
    """Update application status (HR only). On 'selected', auto-sends email and schedules interview."""
    result = await db.execute(select(Application).where(Application.id == application_id))
    application = result.scalar_one_or_none()

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    valid_statuses = {"applied", "screening", "shortlisted", "interview", "selected", "rejected"}
    if request.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    # Sequential Pipeline Enforcement (Server-Side Validation)
    # applied -> screening -> shortlisted -> interview -> selected
    allowed_next_stages = {
        "applied": {"screening", "rejected"},
        "screening": {"shortlisted", "rejected"},
        "shortlisted": {"interview", "rejected"},
        "interview": {"selected", "rejected"},
        "selected": {"rejected"},
        "rejected": {"applied", "screening"}
    }

    current_stage = application.status or "applied"
    if request.status != current_stage and request.status not in allowed_next_stages.get(current_stage, set()):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid pipeline status transition from '{current_stage}' to '{request.status}'. "
                   f"Sequential pipeline requires: Applied → Screening → Shortlisted → Interview → Selected."
        )

    # Update status and stage-specific fields
    application.status = request.status

    if request.status == "interview":
        # Generate meeting link when moving to interview stage
        if request.interview_time:
            application.interview_time = request.interview_time
        application.interview_link = f"https://meet.fridayhr.com/{uuid.uuid4().hex[:12]}"

    elif request.status == "selected":
        # Keep any existing interview details when selecting
        if request.interview_time:
            application.interview_time = request.interview_time
        if not application.interview_link:
            application.interview_link = f"https://meet.fridayhr.com/{uuid.uuid4().hex[:12]}"

    await db.commit()
    await db.refresh(application)

    # Get candidate and job info
    candidate_result = await db.execute(select(User).where(User.id == application.user_id))
    candidate = candidate_result.scalar_one_or_none()

    job_result = await db.execute(select(Job).where(Job.id == application.job_id))
    job = job_result.scalar_one_or_none()

    # Auto-send shortlist/selection email to candidate
    if request.status in ("shortlisted", "selected") and candidate and job:
        try:
            await send_selection_email(
                candidate_email=candidate.email,
                candidate_name=candidate.full_name,
                job_title=job.title,
                interview_time=application.interview_time,
                interview_link=application.interview_link,
                action=request.status,
            )
            application.email_sent = 1
            print(f"[SUCCESS] {request.status} email sent to {candidate.email}")
        except Exception as e:
            application.email_sent = -1
            print(f"[WARN] Notification email failed for {candidate.email}: {e}")

    await db.commit()
    await db.refresh(application)

    return ApplicationResponse(
        **{c.name: getattr(application, c.name) for c in application.__table__.columns},
        candidate_name=candidate.full_name if candidate else "Unknown",
        candidate_email=candidate.email if candidate else "",
        job_title=job.title if job else "",
    )


@router.post("/{application_id}/resend-email", response_model=ApplicationResponse)
async def resend_notification_email(
    application_id: int,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db),
):
    """Resend shortlist/selection notification email (HR only)."""
    result = await db.execute(select(Application).where(Application.id == application_id))
    application = result.scalar_one_or_none()

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    candidate_result = await db.execute(select(User).where(User.id == application.user_id))
    candidate = candidate_result.scalar_one_or_none()

    job_result = await db.execute(select(Job).where(Job.id == application.job_id))
    job = job_result.scalar_one_or_none()

    if not candidate or not job:
        raise HTTPException(status_code=400, detail="Candidate or Job not found")

    action_type = "shortlisted" if application.status == "shortlisted" else "selected"

    try:
        await send_selection_email(
            candidate_email=candidate.email,
            candidate_name=candidate.full_name,
            job_title=job.title,
            interview_time=application.interview_time,
            interview_link=application.interview_link,
            action=action_type,
        )
        application.email_sent = 1
        print(f"[SUCCESS] Resent {action_type} email to {candidate.email}")
    except Exception as e:
        application.email_sent = -1
        print(f"[ERROR] Resend email failed for {candidate.email}: {e}")
        raise HTTPException(status_code=500, detail=f"Email delivery failed: {str(e)}")

    await db.commit()
    await db.refresh(application)

    return ApplicationResponse(
        **{c.name: getattr(application, c.name) for c in application.__table__.columns},
        candidate_name=candidate.full_name,
        candidate_email=candidate.email,
        job_title=job.title,
    )


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    application_id: int,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db),
):
    """Delete an application permanently (HR only)."""
    result = await db.execute(select(Application).where(Application.id == application_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    await db.delete(app)
    await db.commit()
