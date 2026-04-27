import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, LoadNotFound
from app.core.utils import detect_corridor
from app.models.load import LoadStatus
from app.models.user import User
from app.repositories.load_repo import LoadRepository
from app.schemas.load import LoadCreate, LoadOut, LoadUpdate


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


async def get_marketplace(
    cargo_type: str | None,
    corridor: str | None,
    page: int,
    page_size: int,
    db: AsyncSession,
) -> dict:
    repo = LoadRepository(db)
    items, total = await repo.list_marketplace(cargo_type=cargo_type, corridor=corridor, page=page, page_size=page_size)
    return {
        "items": [LoadOut.model_validate(i) for i in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }
