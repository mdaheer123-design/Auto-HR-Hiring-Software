"""
Jobs router — CRUD for HR, search/browse for Candidates.
"""
import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import Optional

from database import get_db
from models.user import User
from models.job import Job
from models.application import Application
from schemas.job import JobCreateRequest, JobUpdateRequest, JobResponse
from middleware.auth import get_current_user, require_hr

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    request: JobCreateRequest,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db),
):
    """Create a new job posting (HR only). Auto-generates highlights if empty."""
    job_data = request.model_dump()
    
    # If highlights not provided, auto-summarize 2-3 key highlights from description
    if not job_data.get("highlights"):
        highlights_list = []
        if request.skills_required:
            try:
                parsed_skills = json.loads(request.skills_required) if isinstance(request.skills_required, str) else request.skills_required
                if isinstance(parsed_skills, list) and parsed_skills:
                    highlights_list.append(f"Key Skills: {', '.join(parsed_skills[:4])}")
            except Exception:
                pass
        
        # Try generating 2 short bullets via Gemini if key is present
        from config import settings
        import httpx
        if settings.GEMINI_API_KEY:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
                prompt = f"Summarize the following job description into 2 concise, bullet points highlighting key requirements:\n\n{request.description}"
                payload = {
                    "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.2, "maxOutputTokens": 200}
                }
                async with httpx.AsyncClient() as client:
                    resp = await client.post(url, json=payload, timeout=10.0)
                    if resp.status_code == 200:
                        gen_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                        bullets = [line.strip("-• ").strip() for line in gen_text.split("\n") if line.strip()]
                        highlights_list.extend(bullets[:2])
            except Exception as e:
                print(f"[WARN] Gemini job highlights generation failed: {e}")
        
        if not highlights_list:
            # Fallback highlights
            highlights_list = [
                f"Location: {request.location or 'Flexible'}",
                f"Experience: {request.experience_min}–{request.experience_max} years required"
            ]
        
        job_data["highlights"] = json.dumps(highlights_list)

    job = Job(
        **job_data,
        created_by=current_user.id,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    return JobResponse(
        **{c.name: getattr(job, c.name) for c in job.__table__.columns},
        creator_name=current_user.full_name,
        application_count=0,
    )


@router.get("/", response_model=dict)
async def list_jobs(
    query: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    experience_min: Optional[int] = Query(None),
    experience_max: Optional[int] = Query(None),
    salary_min: Optional[float] = Query(None),
    salary_max: Optional[float] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=50),
    status_all: Optional[bool] = Query(False),
    db: AsyncSession = Depends(get_db),
):
    """List/search jobs with filters. Public endpoint."""
    stmt = select(Job)
    if not status_all:
        stmt = stmt.where(Job.status == "open")

    # Text search in title and description
    if query:
        search_term = f"%{query}%"
        stmt = stmt.where(
            or_(
                Job.title.ilike(search_term),
                Job.description.ilike(search_term),
                Job.skills_required.ilike(search_term),
            )
        )

    # Filters
    if department:
        stmt = stmt.where(Job.department.ilike(f"%{department}%"))
    if location:
        stmt = stmt.where(Job.location.ilike(f"%{location}%"))
    if job_type:
        stmt = stmt.where(Job.job_type == job_type)
    if experience_min is not None:
        stmt = stmt.where(Job.experience_min >= experience_min)
    if experience_max is not None:
        stmt = stmt.where(Job.experience_max <= experience_max)
    if salary_min is not None:
        stmt = stmt.where(Job.salary_max >= salary_min)
    if salary_max is not None:
        stmt = stmt.where(Job.salary_min <= salary_max)

    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar()

    # Paginate
    stmt = stmt.order_by(Job.created_at.desc())
    stmt = stmt.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(stmt)
    jobs = result.scalars().all()

    # Build response with application counts
    job_responses = []
    for job in jobs:
        app_count_result = await db.execute(
            select(func.count()).where(Application.job_id == job.id)
        )
        app_count = app_count_result.scalar()

        creator_result = await db.execute(select(User.full_name).where(User.id == job.created_by))
        creator_name = creator_result.scalar()

        job_responses.append(JobResponse(
            **{c.name: getattr(job, c.name) for c in job.__table__.columns},
            creator_name=creator_name,
            application_count=app_count,
        ))

    return {
        "jobs": [j.model_dump() for j in job_responses],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: int, db: AsyncSession = Depends(get_db)):
    """Get job detail by ID."""
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    app_count_result = await db.execute(
        select(func.count()).where(Application.job_id == job.id)
    )
    app_count = app_count_result.scalar()

    creator_result = await db.execute(select(User.full_name).where(User.id == job.created_by))
    creator_name = creator_result.scalar()

    return JobResponse(
        **{c.name: getattr(job, c.name) for c in job.__table__.columns},
        creator_name=creator_name,
        application_count=app_count,
    )


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: int,
    request: JobUpdateRequest,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db),
):
    """Update a job posting (HR only)."""
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)

    await db.commit()
    await db.refresh(job)

    return JobResponse(
        **{c.name: getattr(job, c.name) for c in job.__table__.columns},
        creator_name=current_user.full_name,
    )


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: int,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db),
):
    """Close/delete a job posting (HR only)."""
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.status = "closed"
    await db.commit()
