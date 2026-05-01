import math
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, LoadNotFound
from app.core.utils import detect_corridor
from app.models.load import BookingMode, LoadStatus
from app.models.notification import NotificationType
from app.models.user import User
from app.repositories.load_repo import LoadRepository
from app.schemas.load import LoadCreate, LoadOut, LoadUpdate
from app.services import notification_service


async def create_load(payload: LoadCreate, current_user: User, db: AsyncSession) -> LoadOut:
    repo = LoadRepository(db)
    corridor = detect_corridor(
        payload.pickup_latitude,
        payload.pickup_longitude,
        payload.dropoff_latitude,
        payload.dropoff_longitude,
    )
    load = await repo.create(
        shipper_id=current_user.id,
        corridor=corridor,
        **payload.model_dump(),
    )

    if payload.booking_mode == BookingMode.direct and payload.direct_offer_user_id:
        route = f"{payload.pickup_location.split(',')[0]} → {payload.dropoff_location.split(',')[0]}"
        await notification_service.send_notification(
            user_id=payload.direct_offer_user_id,
            notification_type=NotificationType.direct_offer,
            title="Direct Load Offer",
            body=f"{current_user.full_name} is offering you a direct load: {route}. KES {int(payload.price_kes):,}",
            reference_id=load.id,
            reference_type="load",
            db=db,
        )

    return LoadOut.model_validate(load)


async def get_load(load_id: uuid.UUID, db: AsyncSession) -> LoadOut:
    repo = LoadRepository(db)
    load = await repo.get_by_id(load_id)
    if not load:
        raise LoadNotFound()
    return LoadOut.model_validate(load)


async def update_load(load_id: uuid.UUID, payload: LoadUpdate, current_user: User, db: AsyncSession) -> LoadOut:
    repo = LoadRepository(db)
    load = await repo.get_by_id(load_id)
    if not load:
        raise LoadNotFound()
    if load.shipper_id != current_user.id:
        raise ForbiddenError()
    updated = await repo.update(load, **{k: v for k, v in payload.model_dump().items() if v is not None})
    return LoadOut.model_validate(updated)


async def cancel_load(load_id: uuid.UUID, current_user: User, db: AsyncSession) -> LoadOut:
    repo = LoadRepository(db)
    load = await repo.get_by_id(load_id)
    if not load:
        raise LoadNotFound()
    if load.shipper_id != current_user.id:
        raise ForbiddenError()
    updated = await repo.update(load, status=LoadStatus.cancelled)
    return LoadOut.model_validate(updated)


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


async def get_marketplace(
    cargo_type: str | None,
    corridor: str | None,
    page: int,
    page_size: int,
    db: AsyncSession,
    near_lat: float | None = None,
    near_lon: float | None = None,
    radius_km: float | None = 100.0,
) -> dict:
    repo = LoadRepository(db)
    items, total = await repo.list_marketplace(cargo_type=cargo_type, corridor=corridor, page=page, page_size=page_size)

    # Apply proximity filter in-memory when near_lat/near_lon are provided
    if near_lat is not None and near_lon is not None and radius_km:
        filtered = [
            i for i in items
            if i.pickup_latitude is not None
            and i.pickup_longitude is not None
            and _haversine_km(near_lat, near_lon, i.pickup_latitude, i.pickup_longitude) <= radius_km
        ]
        return {
            "items": [LoadOut.model_validate(i) for i in filtered],
            "total": len(filtered),
            "page": page,
            "page_size": page_size,
        }

    return {
        "items": [LoadOut.model_validate(i) for i in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }
