import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserOut, UserPublicOut, UserUpdate

router = APIRouter(tags=["users"])


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
async def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)
    updated = await repo.update(current_user, **payload.model_dump(exclude_none=True))
    return updated


@router.get("/{user_id}/public", response_model=UserPublicOut)
async def get_user_public(
    user_id: uuid.UUID,
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Public profile of any user — safe fields only, no email/phone."""
    user = await UserRepository(db).get_by_id(user_id)
    if not user:
        raise NotFoundError("User")
    return user
