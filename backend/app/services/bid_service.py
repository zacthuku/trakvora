import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BidFloorViolation, BidNotFound, ForbiddenError, LoadNotAvailable, LoadNotFound
from app.models.bid import BidStatus
from app.models.driver import Driver
from app.models.load import BookingMode, LoadStatus
from app.models.user import User, UserRole
from app.repositories.bid_repo import BidRepository
from app.repositories.load_repo import LoadRepository
from app.repositories.shipment_repo import ShipmentRepository
from app.repositories.truck_repo import TruckRepository
from app.schemas.bid import BidCreate, BidOut


async def place_bid(payload: BidCreate, current_user: User, db: AsyncSession) -> BidOut:
    load_repo = LoadRepository(db)
    bid_repo = BidRepository(db)
    truck_repo = TruckRepository(db)

    load = await load_repo.get_by_id(payload.load_id)
    if not load:
        raise LoadNotFound()
    if load.status not in (LoadStatus.available, LoadStatus.bidding):
        raise LoadNotAvailable()
    if load.booking_mode == BookingMode.auction and load.min_bid_floor_kes:
        if payload.amount_kes < float(load.min_bid_floor_kes):
            raise BidFloorViolation(float(load.min_bid_floor_kes))

    truck = await truck_repo.get_by_id(payload.truck_id)
    if not truck or truck.owner_id != current_user.id:
        raise ForbiddenError("Truck does not belong to you")

    existing = await bid_repo.existing_bid(payload.load_id, current_user.id)
    if existing:
        updated = await bid_repo.update(existing, amount_kes=payload.amount_kes, message=payload.message)
        return BidOut.model_validate(updated)

    if load.booking_mode == BookingMode.auction and load.status == LoadStatus.available:
        await load_repo.update(load, status=LoadStatus.bidding)

    bid = await bid_repo.create(
        load_id=payload.load_id,
        owner_id=current_user.id,
        truck_id=payload.truck_id,
        amount_kes=payload.amount_kes,
        message=payload.message,
    )
    return BidOut.model_validate(bid)


async def accept_bid(bid_id: uuid.UUID, current_user: User, db: AsyncSession) -> BidOut:
    bid_repo = BidRepository(db)
    load_repo = LoadRepository(db)
    shipment_repo = ShipmentRepository(db)

    bid = await bid_repo.get_by_id(bid_id)
    if not bid:
        raise BidNotFound()

    load = await load_repo.get_by_id(bid.load_id)
    if not load:
        raise LoadNotFound()
    if load.shipper_id != current_user.id:
        raise ForbiddenError("Only the shipper can accept bids")
    if load.status not in (LoadStatus.available, LoadStatus.bidding):
        raise LoadNotAvailable()

    await bid_repo.update(bid, status=BidStatus.accepted)
    await bid_repo.reject_all_others(bid.load_id, bid.id)
    await load_repo.update(load, status=LoadStatus.booked)

    driver_result = await db.execute(
        select(Driver).where(Driver.current_truck_id == bid.truck_id)
    )
    driver = driver_result.scalar_one_or_none()
    driver_id = driver.user_id if driver else bid.owner_id

    await shipment_repo.create(
        load_id=bid.load_id,
        truck_id=bid.truck_id,
        driver_id=driver_id,
        owner_id=bid.owner_id,
    )

    return BidOut.model_validate(bid)


async def list_bids_for_load(load_id: uuid.UUID, current_user: User, db: AsyncSession) -> list[BidOut]:
    load_repo = LoadRepository(db)
    bid_repo = BidRepository(db)
    load = await load_repo.get_by_id(load_id)
    if not load:
        raise LoadNotFound()
    if load.shipper_id != current_user.id and current_user.role != UserRole.admin:
        raise ForbiddenError()
    bids = await bid_repo.list_by_load(load_id)
    return [BidOut.model_validate(b) for b in bids]
