"""
Resume router — upload, parse, view, download, and delete resumes.
"""
import os
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.user import User
from models.resume import Resume
from schemas.resume import ResumeResponse
from middleware.auth import get_current_user, require_hr, require_candidate
from utils.file_storage import save_upload_file, delete_file, get_file_path
from services.resume_parser import parse_resume
from services.embedding_service import generate_embedding
from services.search_service import index_resume

router = APIRouter(prefix="/api/resumes", tags=["Resumes"])

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload and process a resume file.
    Pipeline: Save → Affinda Parse → BGE-M3 Embed → Elasticsearch Index
    """
    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Save file
    file_path, file_size = await save_upload_file(file)

    if file_size > MAX_FILE_SIZE:
        await delete_file(file_path)
        raise HTTPException(status_code=400, detail="File too large. Maximum 10MB.")

    # Create resume record
    resume = Resume(
        user_id=current_user.id,
        file_path=file_path,
        file_name=file.filename or "resume",
        file_size=file_size,
    )
    db.add(resume)
    await db.commit()
    await db.refresh(resume)

    # ── Pipeline: Parse → Embed → Index (async-safe, fail gracefully) ──
    try:
        parsed_data, raw_text = await parse_resume(file_path)
        resume.parsed_data = parsed_data
        resume.raw_text = raw_text
        await db.commit()
    except Exception as e:
        print(f"[WARN] Resume parsing failed: {e}")

    try:
        if resume.raw_text:
            embedding = await generate_embedding(resume.raw_text)
            await index_resume(
                resume_id=resume.id,
                user_id=current_user.id,
                raw_text=resume.raw_text,
                embedding=embedding,
                name=current_user.full_name,
                email=current_user.email,
                skills=current_user.skills,
            )
            resume.embedding_indexed = True
            await db.commit()
    except Exception as e:
        print(f"[WARN] Embedding/indexing failed: {e}")

    await db.refresh(resume)
    return ResumeResponse.model_validate(resume)


@router.get("/me", response_model=list[ResumeResponse])
async def get_my_resumes(
    current_user: User = Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's resumes."""
    result = await db.execute(
        select(Resume).where(Resume.user_id == current_user.id).order_by(Resume.created_at.desc())
    )
    resumes = result.scalars().all()
    return [ResumeResponse.model_validate(r) for r in resumes]


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get resume details. Candidates see own, HR sees all."""
    result = await db.execute(select(Resume).where(Resume.id == resume_id))
    resume = result.scalar_one_or_none()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if current_user.role == "candidate" and resume.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return ResumeResponse.model_validate(resume)


@router.get("/{resume_id}/download")
async def download_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Download resume file."""
    result = await db.execute(select(Resume).where(Resume.id == resume_id))
    resume = result.scalar_one_or_none()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if current_user.role == "candidate" and resume.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    abs_path = get_file_path(resume.file_path)
    if not abs_path:
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=abs_path,
        filename=resume.file_name,
        media_type="application/octet-stream",
    )


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a resume (Candidate deletes own, HR deletes any)."""
    result = await db.execute(select(Resume).where(Resume.id == resume_id))
    resume = result.scalar_one_or_none()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if current_user.role == "candidate" and resume.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    await delete_file(resume.file_path)
    await db.delete(resume)
    await db.commit()
