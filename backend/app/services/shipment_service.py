import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, ShipmentNotFound
from app.models.load import Load, LoadStatus
from app.models.user import User, UserRole
from app.repositories.shipment_repo import ShipmentRepository
from app.schemas.shipment import ConsignmentNoteOut, LocationUpdate, ShipmentOut, ShipmentStatusUpdate

_VALID_TRANSITIONS = {
    LoadStatus.booked: [LoadStatus.en_route_pickup],
    LoadStatus.en_route_pickup: [LoadStatus.loaded],
    LoadStatus.loaded: [LoadStatus.in_transit],
    LoadStatus.in_transit: [LoadStatus.delivered],
}


async def get_shipment(shipment_id: uuid.UUID, current_user: User, db: AsyncSession) -> ShipmentOut:
    repo = ShipmentRepository(db)
    shipment = await repo.get_by_id(shipment_id)
    if not shipment:
        raise ShipmentNotFound()
    _assert_access(shipment, current_user)
    return ShipmentOut.model_validate(shipment)


async def update_status(
    shipment_id: uuid.UUID,
    payload: ShipmentStatusUpdate,
    current_user: User,
    db: AsyncSession,
) -> ShipmentOut:
    repo = ShipmentRepository(db)
    shipment = await repo.get_by_id(shipment_id)
    if not shipment:
        raise ShipmentNotFound()
    _assert_access(shipment, current_user)

    allowed = _VALID_TRANSITIONS.get(shipment.status, [])
    if payload.status not in allowed:
        raise ForbiddenError(f"Cannot transition from {shipment.status} to {payload.status}")

    updates: dict = {"status": payload.status}
    if payload.status == LoadStatus.delivered:
        updates["delivered_at"] = datetime.now(timezone.utc)
    if payload.pickup_photo_urls:
        updates["pickup_photo_urls"] = payload.pickup_photo_urls
    if payload.delivery_photo_urls:
        updates["delivery_photo_urls"] = payload.delivery_photo_urls

    updated = await repo.update(shipment, **updates)
    return ShipmentOut.model_validate(updated)


async def update_location(
    shipment_id: uuid.UUID,
    payload: LocationUpdate,
    current_user: User,
    db: AsyncSession,
) -> ShipmentOut:
    repo = ShipmentRepository(db)
    shipment = await repo.get_by_id(shipment_id)
    if not shipment:
        raise ShipmentNotFound()
    if shipment.driver_id != current_user.id:
        raise ForbiddenError("Only the assigned driver can update location")
    updates: dict = {"current_latitude": payload.latitude, "current_longitude": payload.longitude}
    if payload.eta:
        updates["eta"] = payload.eta
    updated = await repo.update(shipment, **updates)
    return ShipmentOut.model_validate(updated)


async def sign_consignment_note(
    shipment_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> ConsignmentNoteOut:
    repo = ShipmentRepository(db)
    shipment = await repo.get_by_id(shipment_id)
    if not shipment:
        raise ShipmentNotFound()
    note = await repo.get_consignment_note(shipment_id)
    if not note:
        raise ShipmentNotFound()

    updates: dict = {}
    if current_user.id == shipment.driver_id:
        updates["driver_accepted"] = True
    elif current_user.id == shipment.owner_id:
        updates["owner_accepted"] = True
    else:
        load_result = await db.execute(select(Load).where(Load.id == shipment.load_id))
        load = load_result.scalar_one_or_none()
        if load and load.shipper_id == current_user.id:
            updates["shipper_accepted"] = True
        else:
            raise ForbiddenError()

    updated_note = await repo.update_consignment_note(note, **updates)
    return ConsignmentNoteOut.model_validate(updated_note)


def _assert_access(shipment, current_user: User) -> None:
    if current_user.role == UserRole.admin:
        return
    allowed_ids = {shipment.driver_id, shipment.owner_id}
    if current_user.id not in allowed_ids:
        raise ForbiddenError()
