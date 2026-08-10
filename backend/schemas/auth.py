"""Auth schemas — registration, login, token responses."""
from pydantic import BaseModel, EmailStr
from typing import Optional


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "candidate"  # 'hr' or 'candidate'


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None
    location: Optional[str] = None
    headline: Optional[str] = None
    skills: Optional[str] = None
    experience_years: Optional[int] = 0

    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    headline: Optional[str] = None
    skills: Optional[str] = None
    experience_years: Optional[int] = None
