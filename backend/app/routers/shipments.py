import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.shipment import ConsignmentNoteOut, LocationUpdate, ShipmentOut, ShipmentStatusUpdate
from app.services import shipment_service

router = APIRouter(prefix="/shipments", tags=["shipments"])


@router.get("/{shipment_id}", response_model=ShipmentOut)
async def get_shipment(
    shipment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await shipment_service.get_shipment(shipment_id, current_user, db)


@router.patch("/{shipment_id}/status", response_model=ShipmentOut)
async def update_status(
    shipment_id: uuid.UUID,
    payload: ShipmentStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await shipment_service.update_status(shipment_id, payload, current_user, db)


@router.patch("/{shipment_id}/location", response_model=ShipmentOut)
async def update_location(
    shipment_id: uuid.UUID,
    payload: LocationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await shipment_service.update_location(shipment_id, payload, current_user, db)


@router.post("/{shipment_id}/consignment/sign", response_model=ConsignmentNoteOut)
async def sign_consignment(
    shipment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await shipment_service.sign_consignment_note(shipment_id, current_user, db)
