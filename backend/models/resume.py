"""Resume model — stores parsed resume data and embedding status."""
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, func
from sqlalchemy.orm import relationship
from database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # File info
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=True)  # bytes

    # Parsed data from Affinda
    parsed_data = Column(Text, nullable=True)  # Full JSON from parser
    raw_text = Column(Text, nullable=True)  # Extracted plain text

    # Embedding state
    embedding_indexed = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="resumes")
    applications = relationship("Application", back_populates="resume")
