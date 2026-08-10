"""
HR Chatbot router — Natural language interface for HR queries.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db
from models.user import User
from models.job import Job
from models.application import Application
from schemas.chatbot import ChatMessageRequest, ChatMessageResponse
from middleware.auth import require_hr
from services.chatbot_service import process_chat_message

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])


@router.post("/message", response_model=ChatMessageResponse)
async def chat(
    request: ChatMessageRequest,
    current_user: User = Depends(require_hr),
    db: AsyncSession = Depends(get_db),
):
    """
    Process HR natural-language query.
    Retrieves matching records from Elasticsearch/DB, passes to Grok.
    """
    # Gather DB context for the chatbot
    db_context = {}

    try:
        # Total candidates
        cand_count = await db.execute(
            select(func.count()).select_from(User).where(User.role == "candidate")
        )
        db_context["total_candidates"] = cand_count.scalar()

        # Total jobs
        job_count = await db.execute(
            select(func.count()).select_from(Job).where(Job.status == "open")
        )
        db_context["total_open_jobs"] = job_count.scalar()

        # Total applications
        app_count = await db.execute(select(func.count()).select_from(Application))
        db_context["total_applications"] = app_count.scalar()

        # Job titles for context
        jobs_result = await db.execute(select(Job.title, Job.id).where(Job.status == "open"))
        db_context["open_jobs"] = [
            {"id": j.id, "title": j.title}
            for j in jobs_result.all()
        ]

        # Fetch actual candidate rows (name, email, skills, status, applied job)
        # We fetch up to 30 to prevent context overflow.
        cand_rows_stmt = (
            select(
                User.full_name, 
                User.email, 
                User.skills, 
                Application.status.label("app_status"), 
                Job.title.label("job_title")
            )
            .outerjoin(Application, User.id == Application.user_id)
            .outerjoin(Job, Application.job_id == Job.id)
            .where(User.role == "candidate")
            .order_by(User.created_at.desc())
            .limit(30)
        )
        cand_rows_result = await db.execute(cand_rows_stmt)
        
        candidate_rows = []
        for row in cand_rows_result.all():
            candidate_rows.append({
                "name": row.full_name,
                "email": row.email,
                "skills": row.skills or "",
                "status": row.app_status or "No application",
                "applied_job": row.job_title or "None"
            })
        db_context["candidate_rows"] = candidate_rows

    except Exception as e:
        print(f"[WARN] DB context gathering failed: {e}")

    # Process with Grok + Elasticsearch
    result = await process_chat_message(
        message=request.message,
        db_context=db_context,
    )

    return ChatMessageResponse(
        reply=result["reply"],
        sources=result.get("sources"),
    )
