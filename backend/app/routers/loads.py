import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.schemas.load import LoadCreate, LoadListOut, LoadOut, LoadUpdate
from app.services import load_service

router = APIRouter(prefix="/loads", tags=["loads"])


@router.get("/marketplace", response_model=LoadListOut)
async def marketplace(
    cargo_type: str | None = Query(None),
    corridor: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await load_service.get_marketplace(cargo_type, corridor, page, page_size, db)


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
