from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.repositories.driver_repo import DriverRepository
from app.schemas.driver import DriverOut, DriverProfileCreate, DriverProfileUpdate

router = APIRouter(prefix="/drivers", tags=["drivers"])


@router.get("/me", response_model=DriverOut)
async def get_my_profile(
    current_user: User = Depends(require_role(UserRole.driver)),
    db: AsyncSession = Depends(get_db),
):
    from app.core.exceptions import NotFoundError
    repo = DriverRepository(db)
    driver = await repo.get_by_user_id(current_user.id)
    if not driver:
        raise NotFoundError("Driver profile")
    return driver


@router.post("/me", response_model=DriverOut, status_code=201)
async def create_profile(
    payload: DriverProfileCreate,
    current_user: User = Depends(require_role(UserRole.driver)),
    db: AsyncSession = Depends(get_db),
):
    repo = DriverRepository(db)
    driver = await repo.create(user_id=current_user.id, **payload.model_dump())
    return driver


@router.patch("/me", response_model=DriverOut)
async def update_profile(
    payload: DriverProfileUpdate,
    current_user: User = Depends(require_role(UserRole.driver)),
    db: AsyncSession = Depends(get_db),
):
    from app.core.exceptions import NotFoundError
    repo = DriverRepository(db)
    driver = await repo.get_by_user_id(current_user.id)
    if not driver:
        raise NotFoundError("Driver profile")
    updated = await repo.update(driver, **payload.model_dump(exclude_none=True))
    return updated
