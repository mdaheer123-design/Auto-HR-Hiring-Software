"""User model — supports HR and Candidate roles."""
from sqlalchemy import Column, Integer, String, DateTime, Text, func
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="candidate")  # 'hr' or 'candidate'

    # Candidate profile fields
    phone = Column(String(20), nullable=True)
    location = Column(String(255), nullable=True)
    headline = Column(String(500), nullable=True)
    skills = Column(Text, nullable=True)  # JSON-encoded list
    experience_years = Column(Integer, nullable=True, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    jobs_created = relationship("Job", back_populates="creator", cascade="all, delete-orphan")
