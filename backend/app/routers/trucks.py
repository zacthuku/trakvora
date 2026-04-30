import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError, TruckNotFound
from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.repositories.driver_repo import DriverRepository
from app.repositories.truck_repo import TruckRepository
from app.schemas.driver import AssignDriverRequest
from app.schemas.truck import TruckCreate, TruckOut, TruckUpdate

router = APIRouter(tags=["trucks"])


@router.get("", response_model=list[TruckOut])
async def list_my_trucks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Owners get their fleet; drivers get their owned truck(s)."""
    repo = TruckRepository(db)
    trucks = await repo.list_by_owner(current_user.id)
    return trucks


@router.post("", response_model=TruckOut, status_code=201)
async def create_truck(
    payload: TruckCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Owners and drivers can register trucks. Driver-created trucks set is_driver_owned=True."""
    if current_user.role not in (UserRole.owner, UserRole.driver):
        raise ForbiddenError()

    is_driver_owned = current_user.role == UserRole.driver
    data = payload.model_dump()
    data["is_driver_owned"] = is_driver_owned
    data.pop("is_driver_owned", None)  # use computed value
    repo = TruckRepository(db)
    truck = await repo.create(owner_id=current_user.id, is_driver_owned=is_driver_owned, **payload.model_dump(exclude={"is_driver_owned"}))
    return truck


@router.get("/assigned-to-me", response_model=TruckOut | None)
async def get_assigned_truck(
    current_user: User = Depends(require_role(UserRole.driver)),
    db: AsyncSession = Depends(get_db),
):
    """Returns the truck a driver is currently assigned to by a fleet owner."""
    driver_repo = DriverRepository(db)
    driver = await driver_repo.get_by_user_id(current_user.id)
    if not driver:
        return None

    truck_repo = TruckRepository(db)
    truck = await truck_repo.get_by_assigned_driver(driver.id)
    return truck


@router.get("/{truck_id}", response_model=TruckOut)
async def get_truck(
    truck_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = TruckRepository(db)
    truck = await repo.get_by_id(truck_id)
    if not truck:
        raise TruckNotFound()
    return truck


@router.patch("/{truck_id}", response_model=TruckOut)
async def update_truck(
    truck_id: uuid.UUID,
    payload: TruckUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in (UserRole.owner, UserRole.driver):
        raise ForbiddenError()
    repo = TruckRepository(db)
    truck = await repo.get_by_id(truck_id)
    if not truck:
        raise TruckNotFound()
    if truck.owner_id != current_user.id:
        raise ForbiddenError()
    updated = await repo.update(truck, **payload.model_dump(exclude_none=True))
    return updated


@router.patch("/{truck_id}/assign-driver", response_model=TruckOut)
async def assign_driver_to_truck(
    truck_id: uuid.UUID,
    payload: AssignDriverRequest,
    current_user: User = Depends(require_role(UserRole.owner)),
    db: AsyncSession = Depends(get_db),
):
    """
    Owner assigns (or unassigns) a driver to a specific truck.
    Sets truck.assigned_driver_id and syncs driver.current_truck_id + driver.employer_id.
    """
    truck_repo = TruckRepository(db)
    driver_repo = DriverRepository(db)

    truck = await truck_repo.get_by_id(truck_id)
    if not truck:
        raise TruckNotFound()
    if truck.owner_id != current_user.id:
        raise ForbiddenError()

    # Unassign previous driver if any
    if truck.assigned_driver_id:
        prev_driver = await driver_repo.get_by_id(truck.assigned_driver_id)
        if prev_driver:
            await driver_repo.update(prev_driver, current_truck_id=None, employer_id=None)

    if payload.driver_user_id is None:
        # Unassign only
        updated = await truck_repo.update(truck, assigned_driver_id=None)
    else:
        new_driver = await driver_repo.get_by_user_id(payload.driver_user_id)
        if not new_driver:
            raise NotFoundError("Driver profile")
        await driver_repo.update(
            new_driver,
            current_truck_id=truck.id,
            employer_id=current_user.id,
        )
        updated = await truck_repo.update(truck, assigned_driver_id=new_driver.id)

    return updated
