import enum
import uuid

from sqlalchemy import Boolean, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class TruckType(str, enum.Enum):
    flatbed = "flatbed"
    dry_van = "dry_van"
    reefer = "reefer"
    tanker = "tanker"
    lowbed = "lowbed"
    tipper = "tipper"


class Truck(Base):
    __tablename__ = "trucks"

    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    registration_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    truck_type: Mapped[TruckType] = mapped_column(Enum(TruckType), nullable=False)
    capacity_tonnes: Mapped[float] = mapped_column(Float, nullable=False)
    make: Mapped[str | None] = mapped_column(String(100))
    model: Mapped[str | None] = mapped_column(String(100))
    year: Mapped[int | None] = mapped_column(Integer)
    gps_tracker_id: Mapped[str | None] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    current_latitude: Mapped[float | None] = mapped_column(Float)
    current_longitude: Mapped[float | None] = mapped_column(Float)
    is_driver_owned: Mapped[bool] = mapped_column(Boolean, default=False)
    assigned_driver_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("drivers.id"), nullable=True)

    owner = relationship("User", foreign_keys=[owner_id])
    assigned_driver = relationship("Driver", foreign_keys=[assigned_driver_id])
