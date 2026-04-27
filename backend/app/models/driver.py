import enum
import uuid

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class VerificationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Driver(Base):
    __tablename__ = "drivers"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    licence_number: Mapped[str] = mapped_column(String(50), nullable=False)
    licence_class: Mapped[str | None] = mapped_column(String(10))
    licence_expiry: Mapped[str | None] = mapped_column(String(20))
    licence_photo_url: Mapped[str | None] = mapped_column(String(500))
    verification_status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus), default=VerificationStatus.pending
    )
    current_truck_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("trucks.id"))

    user = relationship("User", foreign_keys=[user_id])
    current_truck = relationship("Truck", foreign_keys=[current_truck_id])
