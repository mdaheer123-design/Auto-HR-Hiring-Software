"""Application schemas — apply flow and status tracking."""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ApplicationCreateRequest(BaseModel):
    job_id: int
    resume_id: Optional[int] = None


class ApplicationStatusUpdate(BaseModel):
    status: str  # screening, shortlisted, interview, selected, rejected
    interview_time: Optional[datetime] = None  # ISO datetime for interview scheduling


class ApplicationResponse(BaseModel):
    id: int
    user_id: int
    job_id: int
    resume_id: Optional[int] = None
    status: str
    ai_score: Optional[float] = None
    ai_strengths: Optional[str] = None
    ai_gaps: Optional[str] = None
    ai_summary: Optional[str] = None
    applied_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # Interview & Email
    interview_time: Optional[datetime] = None
    interview_link: Optional[str] = None
    email_sent: Optional[int] = 0

    # Joined fields
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    job_title: Optional[str] = None
    resume_file_name: Optional[str] = None

    class Config:
        from_attributes = True


class ApplicationListResponse(BaseModel):
    applications: List[ApplicationResponse]
    total: int
    page: int
    per_page: int
