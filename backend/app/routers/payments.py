from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.wallet import TransactionListOut, WalletOut
from app.services import payment_service

router = APIRouter(tags=["payments"])


@router.get("/wallet", response_model=WalletOut)
async def get_wallet(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await payment_service.get_wallet(current_user, db)


@router.get("/transactions", response_model=TransactionListOut)
async def get_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await payment_service.get_transactions(current_user, db, page=page, page_size=page_size)
