import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.driver import VerificationStatus


class DriverProfileCreate(BaseModel):
    licence_number: str
    licence_class: str | None = None
    licence_expiry: str | None = None
    licence_photo_url: str | None = None


class DriverProfileUpdate(BaseModel):
    licence_number: str | None = None
    licence_class: str | None = None
    licence_expiry: str | None = None
    licence_photo_url: str | None = None
    current_truck_id: uuid.UUID | None = None


class DriverOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    user_id: uuid.UUID
    licence_number: str
    licence_class: str | None
    licence_expiry: str | None
    licence_photo_url: str | None
    verification_status: VerificationStatus
    current_truck_id: uuid.UUID | None
    created_at: datetime


class DriverVerificationUpdate(BaseModel):
    verification_status: VerificationStatus
