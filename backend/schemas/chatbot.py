"""Chatbot schemas."""
from pydantic import BaseModel
from typing import Optional, List


class ChatMessageRequest(BaseModel):
    message: str


class ChatMessageResponse(BaseModel):
    reply: str
    sources: Optional[List[dict]] = None
