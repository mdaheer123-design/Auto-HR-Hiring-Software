"""Job schemas — CRUD and search responses."""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class JobCreateRequest(BaseModel):
    title: str
    description: str
    department: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = "full-time"
    experience_min: Optional[int] = 0
    experience_max: Optional[int] = 0
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    skills_required: Optional[str] = None  # JSON string of list
    responsibilities: Optional[str] = None
    highlights: Optional[str] = None  # JSON string of list
    status: Optional[str] = "open"


class JobUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    experience_min: Optional[int] = None
    experience_max: Optional[int] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    skills_required: Optional[str] = None
    responsibilities: Optional[str] = None
    highlights: Optional[str] = None
    status: Optional[str] = None


class JobResponse(BaseModel):
    id: int
    title: str
    description: str
    department: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    experience_min: Optional[int] = 0
    experience_max: Optional[int] = 0
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    skills_required: Optional[str] = None
    responsibilities: Optional[str] = None
    highlights: Optional[str] = None
    status: str
    created_by: int
    creator_name: Optional[str] = None
    application_count: Optional[int] = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class JobSearchParams(BaseModel):
    query: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    experience_min: Optional[int] = None
    experience_max: Optional[int] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    page: int = 1
    per_page: int = 12
