import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.repositories.truck_repo import TruckRepository
from app.schemas.truck import TruckCreate, TruckOut, TruckUpdate

router = APIRouter(prefix="/trucks", tags=["trucks"])


@router.get("", response_model=list[TruckOut])
async def list_my_trucks(
    current_user: User = Depends(require_role(UserRole.owner)),
    db: AsyncSession = Depends(get_db),
):
    repo = TruckRepository(db)
    trucks = await repo.list_by_owner(current_user.id)
    return trucks


@router.post("", response_model=TruckOut, status_code=201)
async def create_truck(
    payload: TruckCreate,
    current_user: User = Depends(require_role(UserRole.owner)),
    db: AsyncSession = Depends(get_db),
):
    repo = TruckRepository(db)
    truck = await repo.create(owner_id=current_user.id, **payload.model_dump())
    return truck


@router.get("/{truck_id}", response_model=TruckOut)
async def get_truck(
    truck_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = TruckRepository(db)
    from app.core.exceptions import TruckNotFound
    truck = await repo.get_by_id(truck_id)
    if not truck:
        raise TruckNotFound()
    return truck


@router.patch("/{truck_id}", response_model=TruckOut)
async def update_truck(
    truck_id: uuid.UUID,
    payload: TruckUpdate,
    current_user: User = Depends(require_role(UserRole.owner)),
    db: AsyncSession = Depends(get_db),
):
    from app.core.exceptions import ForbiddenError, TruckNotFound
    repo = TruckRepository(db)
    truck = await repo.get_by_id(truck_id)
    if not truck:
        raise TruckNotFound()
    if truck.owner_id != current_user.id:
        raise ForbiddenError()
    updated = await repo.update(truck, **payload.model_dump(exclude_none=True))
    return updated
