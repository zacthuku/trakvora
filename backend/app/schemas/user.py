import re
import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import UserRole


def _check_password(v: str) -> str:
    errors = []
    if len(v) < 8:
        errors.append("at least 8 characters")
    if not re.search(r"[A-Z]", v):
        errors.append("one uppercase letter")
    if not re.search(r"[a-z]", v):
        errors.append("one lowercase letter")
    if not re.search(r"\d", v):
        errors.append("one digit")
    if not re.search(r'[!@#$%^&*()\-_=+\[\]{};:\'",.<>?/\\|`~]', v):
        errors.append("one special character")
    if errors:
        raise ValueError(f"Password must contain: {', '.join(errors)}")
    return v


class UserRegister(BaseModel):
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=20)
    full_name: str = Field(..., min_length=2, max_length=255)
    company_name: str | None = None
    password: str = Field(..., min_length=8)
    role: UserRole

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return _check_password(v)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class OTPRequiredResponse(BaseModel):
    """Returned after registration or when a verified user's channel is already set."""
    requires_verification: bool = True
    email: str
    channel: str = "email"
    destination: str = ""


class OTPChannelRequiredResponse(BaseModel):
    """Returned on first post-registration login — user must pick their 2FA channel."""
    requires_channel_selection: bool = True
    email: str
    phone_available: bool


class SendOTPRequest(BaseModel):
    email: EmailStr
    channel: str = Field(..., pattern="^(email|sms)$")


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)


class ResendOTPRequest(BaseModel):
    email: EmailStr


class RefreshRequest(BaseModel):
    refresh_token: str


class UserUpdate(BaseModel):
    full_name: str | None = None
    company_name: str | None = None
    phone: str | None = None
    profile_photo_url: str | None = None
    otp_channel: str | None = None


class GoogleAuthRequest(BaseModel):
    access_token: str
    role: UserRole | None = None


class GoogleNewUserResponse(BaseModel):
    requires_role_selection: bool = True
    email: str
    full_name: str
    profile_photo_url: str | None = None


class UserOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    email: str
    phone: str | None
    full_name: str
    company_name: str | None
    role: UserRole
    is_active: bool
    is_verified: bool
    otp_channel: str | None
    rating: float | None
    total_trips: int
    profile_photo_url: str | None
    created_at: datetime


class UserPublicOut(BaseModel):
    """Safe public profile — no email/phone, suitable for any authenticated viewer."""
    model_config = {"from_attributes": True}

    id:                uuid.UUID
    full_name:         str
    company_name:      str | None
    profile_photo_url: str | None
    rating:            float | None
    total_trips:       int
    role:              UserRole
