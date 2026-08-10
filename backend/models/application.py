"""Application model — links candidate to job with status tracking."""
from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey, func
from sqlalchemy.orm import relationship
from database import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True)

    # Status pipeline: applied → screening → shortlisted → interview → selected / rejected
    status = Column(String(30), nullable=False, default="applied")

    # AI screening results
    ai_score = Column(Float, nullable=True)
    ai_strengths = Column(Text, nullable=True)  # JSON-encoded list
    ai_gaps = Column(Text, nullable=True)  # JSON-encoded list
    ai_summary = Column(Text, nullable=True)

    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Interview scheduling
    interview_time = Column(DateTime(timezone=True), nullable=True)
    interview_link = Column(String(500), nullable=True)

    # Email notification status (1 = sent, -1 = failed, 0 = none)
    email_sent = Column(Integer, nullable=True, default=0)

    # Relationships
    user = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    resume = relationship("Resume", back_populates="applications")
