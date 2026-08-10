"""Resume schemas."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ResumeResponse(BaseModel):
    id: int
    user_id: int
    file_name: str
    file_size: Optional[int] = None
    parsed_data: Optional[str] = None
    raw_text: Optional[str] = None
    embedding_indexed: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
