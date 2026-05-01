import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.load import LoadStatus
from app.models.notification import NotificationType
from app.models.user import User, UserRole
from app.repositories.load_repo import LoadRepository
from app.repositories.notification_repo import NotificationRepository
from app.schemas.load import LoadCreate, LoadListOut, LoadOut, LoadUpdate
from app.services import load_service, notification_service


class OfferResponse(BaseModel):
    accept: bool
    notification_id: uuid.UUID | None = None

router = APIRouter(tags=["loads"])


@router.get("/marketplace", response_model=LoadListOut)
async def marketplace(
    cargo_type: str | None = Query(None),
    corridor: str | None = Query(None),
    near_lat: float | None = Query(None, description="Filter loads whose pickup is within radius_km of this latitude"),
    near_lon: float | None = Query(None),
    radius_km: float | None = Query(100.0, description="Radius in km for proximity filter"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await load_service.get_marketplace(
        cargo_type, corridor, page, page_size, db,
        near_lat=near_lat, near_lon=near_lon, radius_km=radius_km,
    )


@router.post("", response_model=LoadOut, status_code=201)
async def create_load(
    payload: LoadCreate,
    current_user: User = Depends(require_role(UserRole.shipper)),
    db: AsyncSession = Depends(get_db),
):
    return await load_service.create_load(payload, current_user, db)


@router.get("/{load_id}", response_model=LoadOut)
async def get_load(
    load_id: uuid.UUID,
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await load_service.get_load(load_id, db)


@router.patch("/{load_id}", response_model=LoadOut)
async def update_load(
    load_id: uuid.UUID,
    payload: LoadUpdate,
    current_user: User = Depends(require_role(UserRole.shipper)),
    db: AsyncSession = Depends(get_db),
):
    return await load_service.update_load(load_id, payload, current_user, db)


@router.delete("/{load_id}", response_model=LoadOut)
async def cancel_load(
    load_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.shipper)),
    db: AsyncSession = Depends(get_db),
):
    return await load_service.cancel_load(load_id, current_user, db)


@router.post("/{load_id}/offer-response", response_model=LoadOut)
async def respond_to_direct_offer(
    load_id: uuid.UUID,
    payload: OfferResponse,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Driver or fleet owner accepts or declines a direct load offer."""
    repo = LoadRepository(db)
    load = await repo.get_by_id(load_id)
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    if load.direct_offer_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="This offer is not for you")
    if load.status not in (LoadStatus.available,):
        raise HTTPException(status_code=409, detail="Offer already responded to")

    if payload.accept:
        updated = await repo.update(load, status=LoadStatus.bidding)
        action_label = "accepted"
    else:
        updated = await repo.update(load, status=LoadStatus.cancelled)
        action_label = "declined"

    if payload.notification_id:
        notif_repo = NotificationRepository(db)
        await notif_repo.mark_read(payload.notification_id, current_user.id)

    await notification_service.send_notification(
        user_id=load.shipper_id,
        notification_type=NotificationType.direct_offer_response,
        title=f"Offer {action_label.capitalize()}",
        body=f"{current_user.full_name} has {action_label} your direct load offer.",
        reference_id=load.id,
        reference_type="load",
        db=db,
    )

    return LoadOut.model_validate(updated)
