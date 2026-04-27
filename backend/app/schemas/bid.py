import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.bid import BidStatus


class BidCreate(BaseModel):
    load_id: uuid.UUID
    truck_id: uuid.UUID
    amount_kes: float = Field(..., gt=0)
    message: str | None = None


class BidOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    load_id: uuid.UUID
    owner_id: uuid.UUID
    truck_id: uuid.UUID
    amount_kes: float
    status: BidStatus
    message: str | None
    created_at: datetime


class BidStatusUpdate(BaseModel):
    status: BidStatus
