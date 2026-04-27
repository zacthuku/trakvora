import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.wallet import Transaction, Wallet


class WalletRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user(self, user_id: uuid.UUID) -> Wallet | None:
        result = await self.db.execute(select(Wallet).where(Wallet.user_id == user_id))
        return result.scalar_one_or_none()

    async def create_wallet(self, user_id: uuid.UUID) -> Wallet:
        wallet = Wallet(user_id=user_id)
        self.db.add(wallet)
        await self.db.flush()
        await self.db.refresh(wallet)
        return wallet

    async def update_balance(self, wallet: Wallet, balance_delta: float, escrow_delta: float = 0.0) -> Wallet:
        wallet.balance_kes = float(wallet.balance_kes) + balance_delta
        wallet.escrow_kes = float(wallet.escrow_kes) + escrow_delta
        await self.db.flush()
        await self.db.refresh(wallet)
        return wallet

    async def list_transactions(
        self,
        wallet_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Transaction], int]:
        q = select(Transaction).where(Transaction.wallet_id == wallet_id).order_by(Transaction.created_at.desc())
        total_result = await self.db.execute(select(Transaction).where(Transaction.wallet_id == wallet_id))
        total = len(total_result.scalars().all())
        q = q.offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(q)
        return result.scalars().all(), total

    async def create_transaction(self, **kwargs) -> Transaction:
        tx = Transaction(**kwargs)
        self.db.add(tx)
        await self.db.flush()
        await self.db.refresh(tx)
        return tx
