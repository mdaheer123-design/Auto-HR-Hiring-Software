"""Job posting model — created by HR users."""
from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey, func
from sqlalchemy.orm import relationship
from database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    department = Column(String(100), nullable=True)
    location = Column(String(255), nullable=True)
    job_type = Column(String(50), nullable=True, default="full-time")  # full-time, part-time, contract, internship
    experience_min = Column(Integer, nullable=True, default=0)
    experience_max = Column(Integer, nullable=True, default=0)
    salary_min = Column(Float, nullable=True)
    salary_max = Column(Float, nullable=True)
    skills_required = Column(Text, nullable=True)  # JSON-encoded list
    responsibilities = Column(Text, nullable=True)  # Text bullet points
    highlights = Column(Text, nullable=True)  # JSON-encoded list of highlight bullets
    status = Column(String(20), nullable=False, default="open")  # open, closed, draft

    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    creator = relationship("User", back_populates="jobs_created")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
