import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.wallet import TransactionStatus, TransactionType


class WalletOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    user_id: uuid.UUID
    balance_kes: float
    escrow_kes: float
    currency: str
    updated_at: datetime


class TransactionOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    wallet_id: uuid.UUID
    shipment_id: uuid.UUID | None
    transaction_type: TransactionType
    amount_kes: float
    status: TransactionStatus
    reference: str | None
    description: str | None
    created_at: datetime


class TransactionListOut(BaseModel):
    items: list[TransactionOut]
    total: int
    page: int
    page_size: int
