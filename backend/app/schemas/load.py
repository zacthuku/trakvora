import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.load import BookingMode, CargoType, LoadStatus


class LoadCreate(BaseModel):
    pickup_location: str = Field(..., max_length=255)
    pickup_latitude: float
    pickup_longitude: float
    dropoff_location: str = Field(..., max_length=255)
    dropoff_latitude: float
    dropoff_longitude: float
    cargo_type: CargoType
    weight_tonnes: float = Field(..., gt=0)
    volume_cbm: float | None = None
    cargo_description: str | None = None
    cargo_value_kes: float | None = None
    required_truck_type: str | None = None
    price_kes: float = Field(..., gt=0)
    booking_mode: BookingMode = BookingMode.fixed
    min_bid_floor_kes: float | None = None
    pickup_deadline: str | None = None
    special_instructions: str | None = None
    requires_insurance: bool = False


class LoadUpdate(BaseModel):
    pickup_deadline: str | None = None
    special_instructions: str | None = None
    price_kes: float | None = None
    status: LoadStatus | None = None


class LoadOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    shipper_id: uuid.UUID
    pickup_location: str
    pickup_latitude: float
    pickup_longitude: float
    dropoff_location: str
    dropoff_latitude: float
    dropoff_longitude: float
    corridor: str | None
    cargo_type: CargoType
    weight_tonnes: float
    volume_cbm: float | None
    cargo_description: str | None
    cargo_value_kes: float | None
    required_truck_type: str | None
    price_kes: float
    booking_mode: BookingMode
    min_bid_floor_kes: float | None
    status: LoadStatus
    pickup_deadline: str | None
    special_instructions: str | None
    requires_insurance: bool
    created_at: datetime


class LoadListOut(BaseModel):
    model_config = {"from_attributes": True}

    items: list[LoadOut]
    total: int
    page: int
    page_size: int
