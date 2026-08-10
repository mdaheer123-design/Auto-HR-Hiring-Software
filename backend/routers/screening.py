"""
Screening router — AI resume screening via Gemini API.
"""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.user import User
from models.application import Application
from models.job import Job
from models.resume import Resume
from schemas.application import ApplicationResponse
from middleware.auth import require_hr
from services.screening_service import screen_candidate

router = APIRouter(prefix="/api/screening", tags=["AI Screening"])


@router.post("/{application_id}")
async def screen_application(
    application_id: int,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db),
):
    """Trigger AI screening for a single application (HR only)."""
    # Get application
    result = await db.execute(select(Application).where(Application.id == application_id))
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Get job description
    job_result = await db.execute(select(Job).where(Job.id == application.job_id))
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Get resume text
    resume_text = ""
    if application.resume_id:
        resume_result = await db.execute(select(Resume).where(Resume.id == application.resume_id))
        resume = resume_result.scalar_one_or_none()
        if resume and resume.raw_text:
            resume_text = resume.raw_text
        elif resume and resume.parsed_data:
            resume_text = resume.parsed_data

    if not resume_text:
        candidate_res = await db.execute(select(User).where(User.id == application.user_id))
        cand = candidate_res.scalar_one_or_none()
        resume_text = f"Candidate Name: {cand.full_name if cand else 'Applicant'}\nEmail: {cand.email if cand else ''}\nSkills: {cand.skills if cand and cand.skills else 'Software Engineering'}\nExperience: {cand.experience_years if cand else 2} years"

    # Run AI screening
    screening_result = await screen_candidate(
        resume_text=resume_text,
        job_description=job.description,
        job_title=job.title,
    )

    # Update application with results
    application.ai_score = screening_result["score"]
    application.ai_strengths = json.dumps(screening_result["strengths"])
    application.ai_gaps = json.dumps(screening_result["gaps"])
    application.ai_summary = screening_result["summary"]
    application.status = "screening"

    await db.commit()
    await db.refresh(application)

    # Get candidate info for response
    candidate_result = await db.execute(select(User).where(User.id == application.user_id))
    candidate = candidate_result.scalar_one_or_none()

    return {
        "application_id": application.id,
        "score": screening_result["score"],
        "strengths": screening_result["strengths"],
        "gaps": screening_result["gaps"],
        "summary": screening_result["summary"],
        "candidate_name": candidate.full_name if candidate else "Unknown",
        "job_title": job.title,
    }


@router.post("/batch/{job_id}")
async def screen_all_for_job(
    job_id: int,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db),
):
    """Screen all unscreened applications for a job (HR only)."""
    # Get job
    job_result = await db.execute(select(Job).where(Job.id == job_id))
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Get unscreened applications
    result = await db.execute(
        select(Application).where(
            Application.job_id == job_id,
            Application.ai_score.is_(None),
        )
    )
    applications = result.scalars().all()

    if not applications:
        return {"message": "No unscreened applications found", "screened": 0}

    results = []
    for app in applications:
        resume_text = ""
        if app.resume_id:
            resume_result = await db.execute(select(Resume).where(Resume.id == app.resume_id))
            resume = resume_result.scalar_one_or_none()
            if resume:
                resume_text = resume.raw_text or resume.parsed_data or ""

        if not resume_text:
            continue

        try:
            screening_result = await screen_candidate(
                resume_text=resume_text,
                job_description=job.description,
                job_title=job.title,
            )

            app.ai_score = screening_result["score"]
            app.ai_strengths = json.dumps(screening_result["strengths"])
            app.ai_gaps = json.dumps(screening_result["gaps"])
            app.ai_summary = screening_result["summary"]
            app.status = "screening"

            results.append({
                "application_id": app.id,
                "score": screening_result["score"],
            })
        except Exception as e:
            print(f"[WARN] Screening failed for application {app.id}: {e}")

    await db.commit()

    return {
        "message": f"Screened {len(results)} applications",
        "screened": len(results),
        "results": results,
    }
