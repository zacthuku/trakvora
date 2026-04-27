import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.wallet import TransactionStatus, TransactionType
from app.repositories.wallet_repo import WalletRepository
from app.schemas.wallet import TransactionListOut, TransactionOut, WalletOut


async def get_wallet(current_user: User, db: AsyncSession) -> WalletOut:
    repo = WalletRepository(db)
    wallet = await repo.get_by_user(current_user.id)
    if not wallet:
        wallet = await repo.create_wallet(current_user.id)
    return WalletOut.model_validate(wallet)


async def get_transactions(
    current_user: User,
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
) -> TransactionListOut:
    repo = WalletRepository(db)
    wallet = await repo.get_by_user(current_user.id)
    if not wallet:
        return TransactionListOut(items=[], total=0, page=page, page_size=page_size)
    items, total = await repo.list_transactions(wallet.id, page=page, page_size=page_size)
    return TransactionListOut(
        items=[TransactionOut.model_validate(t) for t in items],
        total=total,
        page=page,
        page_size=page_size,
    )


async def lock_escrow(shipment_id: uuid.UUID, shipper_user_id: uuid.UUID, amount_kes: float, db: AsyncSession) -> None:
    repo = WalletRepository(db)
    wallet = await repo.get_by_user(shipper_user_id)
    if not wallet:
        return
    await repo.update_balance(wallet, balance_delta=-amount_kes, escrow_delta=amount_kes)
    await repo.create_transaction(
        wallet_id=wallet.id,
        shipment_id=shipment_id,
        transaction_type=TransactionType.escrow_hold,
        amount_kes=amount_kes,
        status=TransactionStatus.completed,
        description=f"Escrow hold for shipment",
    )


async def release_escrow(
    shipment_id: uuid.UUID,
    shipper_user_id: uuid.UUID,
    owner_user_id: uuid.UUID,
    amount_kes: float,
    db: AsyncSession,
) -> None:
    repo = WalletRepository(db)
    shipper_wallet = await repo.get_by_user(shipper_user_id)
    if shipper_wallet:
        await repo.update_balance(shipper_wallet, balance_delta=0, escrow_delta=-amount_kes)
        await repo.create_transaction(
            wallet_id=shipper_wallet.id,
            shipment_id=shipment_id,
            transaction_type=TransactionType.escrow_release,
            amount_kes=amount_kes,
            status=TransactionStatus.completed,
            description="Escrow released on delivery",
        )

    owner_wallet = await repo.get_by_user(owner_user_id)
    if not owner_wallet:
        owner_wallet = await repo.create_wallet(owner_user_id)
    await repo.update_balance(owner_wallet, balance_delta=amount_kes)
    await repo.create_transaction(
        wallet_id=owner_wallet.id,
        shipment_id=shipment_id,
        transaction_type=TransactionType.payout,
        amount_kes=amount_kes,
        status=TransactionStatus.completed,
        description="Payment received for completed delivery",
    )
