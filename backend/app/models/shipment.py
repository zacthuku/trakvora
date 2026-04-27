import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.load import LoadStatus


class Shipment(Base):
    __tablename__ = "shipments"

    load_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("loads.id"), unique=True, nullable=False)
    truck_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("trucks.id"), nullable=False)
    driver_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status: Mapped[LoadStatus] = mapped_column(default=LoadStatus.booked)
    escrow_locked: Mapped[bool] = mapped_column(default=False)
    escrow_released: Mapped[bool] = mapped_column(default=False)
    pickup_photo_urls: Mapped[str | None] = mapped_column(String(2000))
    delivery_photo_urls: Mapped[str | None] = mapped_column(String(2000))
    current_latitude: Mapped[float | None] = mapped_column(Float)
    current_longitude: Mapped[float | None] = mapped_column(Float)
    eta: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    dispute_open: Mapped[bool] = mapped_column(default=False)

    load = relationship("Load", foreign_keys=[load_id])
    truck = relationship("Truck", foreign_keys=[truck_id])
    driver = relationship("User", foreign_keys=[driver_id])
    owner = relationship("User", foreign_keys=[owner_id])
