import enum

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class UserRole(str, enum.Enum):
    shipper = "shipper"
    owner = "owner"
    driver = "driver"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    company_name: Mapped[str | None] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    national_id: Mapped[str | None] = mapped_column(String(50))
    profile_photo_url: Mapped[str | None] = mapped_column(String(500))
    rating: Mapped[float] = mapped_column(default=0.0)
    total_trips: Mapped[int] = mapped_column(default=0)
    cancellation_count: Mapped[int] = mapped_column(default=0)
