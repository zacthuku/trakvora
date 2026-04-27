import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.load import LoadStatus


class ShipmentOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    load_id: uuid.UUID
    truck_id: uuid.UUID
    driver_id: uuid.UUID
    owner_id: uuid.UUID
    status: LoadStatus
    escrow_locked: bool
    escrow_released: bool
    pickup_photo_urls: str | None
    delivery_photo_urls: str | None
    current_latitude: float | None
    current_longitude: float | None
    eta: datetime | None
    delivered_at: datetime | None
    dispute_open: bool
    created_at: datetime


class ShipmentStatusUpdate(BaseModel):
    status: LoadStatus
    pickup_photo_urls: str | None = None
    delivery_photo_urls: str | None = None


class LocationUpdate(BaseModel):
    latitude: float
    longitude: float
    eta: datetime | None = None


class ConsignmentNoteOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    shipment_id: uuid.UUID
    reference_number: str
    cargo_details: str
    s3_url: str | None
    shipper_accepted: bool
    owner_accepted: bool
    driver_accepted: bool
    created_at: datetime
