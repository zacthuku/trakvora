import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.driver import AvailabilityStatus, Driver, VerificationStatus
from app.models.load import Load, LoadStatus
from app.models.notification import Notification
from app.models.shipment import Shipment
from app.models.truck import Truck
from app.models.user import User, UserRole
from app.models.wallet import Transaction, TransactionStatus, TransactionType, Wallet

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_admin():
    return Depends(require_role(UserRole.admin))


# ── Dashboard ────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def admin_dashboard(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
) -> dict[str, Any]:
    # User counts
    total_users = await db.scalar(select(func.count()).select_from(User))
    active_users = await db.scalar(select(func.count()).select_from(User).where(User.is_active))
    suspended_users = await db.scalar(select(func.count()).select_from(User).where(~User.is_active))
    verified_users = await db.scalar(select(func.count()).select_from(User).where(User.is_verified))

    role_rows = (await db.execute(
        select(User.role, func.count().label("cnt")).group_by(User.role)
    )).all()
    users_by_role = {str(r.role): r.cnt for r in role_rows}

    # Load counts
    total_loads = await db.scalar(select(func.count()).select_from(Load))
    load_rows = (await db.execute(
        select(Load.status, func.count().label("cnt")).group_by(Load.status)
    )).all()
    loads_by_status = {str(r.status): r.cnt for r in load_rows}

    # Shipment counts
    total_shipments = await db.scalar(select(func.count()).select_from(Shipment))
    active_shipments = await db.scalar(
        select(func.count()).select_from(Shipment).where(
            Shipment.status.in_([LoadStatus.en_route_pickup, LoadStatus.loaded, LoadStatus.in_transit])
        )
    )
    delivered_shipments = await db.scalar(
        select(func.count()).select_from(Shipment).where(Shipment.status == LoadStatus.delivered)
    )
    open_disputes = await db.scalar(
        select(func.count()).select_from(Shipment).where(Shipment.dispute_open == True)  # noqa: E712
    )

    # Driver verification
    pending_verifications = await db.scalar(
        select(func.count()).select_from(Driver).where(
            Driver.verification_status == VerificationStatus.pending
        )
    )
    verified_drivers = await db.scalar(
        select(func.count()).select_from(Driver).where(
            Driver.verification_status == VerificationStatus.approved
        )
    )
    available_drivers = await db.scalar(
        select(func.count()).select_from(Driver).where(
            Driver.availability_status == AvailabilityStatus.available
        )
    )

    # Truck counts
    total_trucks = await db.scalar(select(func.count()).select_from(Truck))
    active_trucks = await db.scalar(
        select(func.count()).select_from(Truck).where(Truck.is_active == True)  # noqa: E712
    )

    # Financial
    platform_revenue = await db.scalar(
        select(func.coalesce(func.sum(Transaction.amount_kes), 0)).where(
            Transaction.transaction_type == TransactionType.platform_fee,
            Transaction.status == TransactionStatus.completed,
        )
    )
    total_wallet_balance = await db.scalar(
        select(func.coalesce(func.sum(Wallet.balance_kes), 0))
    )
    total_escrow = await db.scalar(
        select(func.coalesce(func.sum(Wallet.escrow_kes), 0))
    )
    total_transactions = await db.scalar(select(func.count()).select_from(Transaction))

    # Recent activity (last 12 notifications)
    notif_rows = (await db.execute(
        select(
            Notification.id,
            Notification.notification_type,
            Notification.title,
            Notification.body,
            Notification.created_at,
            User.full_name,
            User.role,
        )
        .join(User, User.id == Notification.user_id)
        .order_by(Notification.created_at.desc())
        .limit(12)
    )).all()

    recent_activity = [
        {
            "id": str(r.id),
            "type": str(r.notification_type),
            "title": r.title,
            "body": r.body,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "user_name": r.full_name,
            "user_role": str(r.role),
        }
        for r in notif_rows
    ]

    return {
        "users": {
            "total": total_users or 0,
            "active": active_users or 0,
            "suspended": suspended_users or 0,
            "verified": verified_users or 0,
            "by_role": users_by_role,
        },
        "loads": {
            "total": total_loads or 0,
            "by_status": loads_by_status,
        },
        "shipments": {
            "total": total_shipments or 0,
            "active": active_shipments or 0,
            "delivered": delivered_shipments or 0,
            "open_disputes": open_disputes or 0,
        },
        "drivers": {
            "pending_verifications": pending_verifications or 0,
            "verified": verified_drivers or 0,
            "available": available_drivers or 0,
        },
        "trucks": {
            "total": total_trucks or 0,
            "active": active_trucks or 0,
        },
        "finance": {
            "platform_revenue_kes": float(platform_revenue or 0),
            "total_wallet_balance_kes": float(total_wallet_balance or 0),
            "total_escrow_kes": float(total_escrow or 0),
            "total_transactions": total_transactions or 0,
        },
        "recent_activity": recent_activity,
    }


# ── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users")
async def admin_list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    role: str | None = None,
    is_active: bool | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
) -> dict[str, Any]:
    q = select(User)
    if role:
        q = q.where(User.role == role)
    if is_active is not None:
        q = q.where(User.is_active == is_active)
    if search:
        term = f"%{search}%"
        q = q.where(User.full_name.ilike(term) | User.email.ilike(term))

    total = await db.scalar(select(func.count()).select_from(q.subquery()))
    rows = (await db.execute(
        q.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )).scalars().all()

    return {
        "total": total or 0,
        "page": page,
        "limit": limit,
        "items": [
            {
                "id": str(u.id),
                "email": u.email,
                "full_name": u.full_name,
                "phone": u.phone,
                "company_name": u.company_name,
                "role": str(u.role),
                "is_active": u.is_active,
                "is_verified": u.is_verified,
                "rating": u.rating,
                "total_trips": u.total_trips,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in rows
        ],
    }


@router.patch("/users/{user_id}/suspend")
async def toggle_suspend_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
) -> dict[str, Any]:
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_active = not user.is_active
    await db.commit()
    await db.refresh(user)
    return {"id": str(user.id), "is_active": user.is_active}


@router.patch("/users/{user_id}/verify")
async def toggle_verify_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
) -> dict[str, Any]:
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_verified = not user.is_verified
    await db.commit()
    await db.refresh(user)
    return {"id": str(user.id), "is_verified": user.is_verified}


# ── Drivers ───────────────────────────────────────────────────────────────────

@router.get("/drivers")
async def admin_list_drivers(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    verification_status: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
) -> dict[str, Any]:
    q = select(Driver, User).join(User, User.id == Driver.user_id)
    if verification_status:
        q = q.where(Driver.verification_status == verification_status)

    total = await db.scalar(
        select(func.count()).select_from(Driver)
        .where(Driver.verification_status == verification_status if verification_status else True)
    )
    rows = (await db.execute(
        q.order_by(Driver.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )).all()

    return {
        "total": total or 0,
        "page": page,
        "limit": limit,
        "items": [
            {
                "id": str(d.id),
                "user_id": str(d.user_id),
                "full_name": u.full_name,
                "email": u.email,
                "phone": u.phone,
                "rating": u.rating,
                "total_trips": u.total_trips,
                "licence_number": d.licence_number,
                "licence_class": d.licence_class,
                "licence_expiry": d.licence_expiry,
                "verification_status": str(d.verification_status),
                "ntsa_verified": d.ntsa_verified,
                "availability_status": str(d.availability_status),
                "availability_location": d.availability_location,
                "experience_years": d.experience_years,
                "has_licence_photo": bool(d.licence_photo_url),
                "has_passport_photo": bool(d.passport_photo_url),
                "has_psv_badge": bool(d.psv_badge_url),
                "has_police_clearance": bool(d.police_clearance_url),
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d, u in rows
        ],
    }


@router.patch("/drivers/{driver_id}/verification")
async def update_driver_verification(
    driver_id: uuid.UUID,
    payload: dict[str, str],
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
) -> dict[str, Any]:
    driver = (await db.execute(select(Driver).where(Driver.id == driver_id))).scalar_one_or_none()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
    new_status = payload.get("status")
    if new_status not in ("approved", "rejected", "pending"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")
    driver.verification_status = new_status
    driver.ntsa_verified = new_status == "approved"
    await db.commit()
    await db.refresh(driver)
    return {"id": str(driver.id), "verification_status": str(driver.verification_status), "ntsa_verified": driver.ntsa_verified}


# ── Loads ─────────────────────────────────────────────────────────────────────

@router.get("/loads")
async def admin_list_loads(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    load_status: str | None = Query(None, alias="status"),
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
) -> dict[str, Any]:
    q = select(Load, User).join(User, User.id == Load.shipper_id)
    if load_status:
        q = q.where(Load.status == load_status)
    if search:
        term = f"%{search}%"
        q = q.where(Load.pickup_location.ilike(term) | Load.dropoff_location.ilike(term))

    total = await db.scalar(select(func.count()).select_from(q.subquery()))
    rows = (await db.execute(
        q.order_by(Load.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )).all()

    return {
        "total": total or 0,
        "page": page,
        "limit": limit,
        "items": [
            {
                "id": str(lo.id),
                "shipper_name": u.full_name,
                "shipper_email": u.email,
                "pickup_location": lo.pickup_location,
                "dropoff_location": lo.dropoff_location,
                "corridor": lo.corridor,
                "cargo_type": str(lo.cargo_type),
                "weight_tonnes": lo.weight_tonnes,
                "price_kes": float(lo.price_kes),
                "booking_mode": str(lo.booking_mode),
                "status": str(lo.status),
                "pickup_date": lo.pickup_date,
                "requires_insurance": lo.requires_insurance,
                "created_at": lo.created_at.isoformat() if lo.created_at else None,
            }
            for lo, u in rows
        ],
    }


@router.patch("/loads/{load_id}/cancel")
async def admin_cancel_load(
    load_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
) -> dict[str, Any]:
    load = (await db.execute(select(Load).where(Load.id == load_id))).scalar_one_or_none()
    if not load:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Load not found")
    load.status = LoadStatus.cancelled
    await db.commit()
    return {"id": str(load.id), "status": "cancelled"}


# ── Shipments ─────────────────────────────────────────────────────────────────

@router.get("/shipments")
async def admin_list_shipments(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    disputes_only: bool = False,
    ship_status: str | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
) -> dict[str, Any]:
    q = (
        select(Shipment, Load, User)
        .join(Load, Load.id == Shipment.load_id)
        .join(User, User.id == Load.shipper_id)
    )
    if disputes_only:
        q = q.where(Shipment.dispute_open == True)  # noqa: E712
    if ship_status:
        q = q.where(Shipment.status == ship_status)

    total = await db.scalar(select(func.count()).select_from(q.subquery()))
    rows = (await db.execute(
        q.order_by(Shipment.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )).all()

    return {
        "total": total or 0,
        "page": page,
        "limit": limit,
        "items": [
            {
                "id": str(sh.id),
                "load_id": str(sh.load_id),
                "pickup_location": lo.pickup_location,
                "dropoff_location": lo.dropoff_location,
                "corridor": lo.corridor,
                "shipper_name": u.full_name,
                "status": str(sh.status),
                "escrow_locked": sh.escrow_locked,
                "escrow_released": sh.escrow_released,
                "dispute_open": sh.dispute_open,
                "price_kes": float(lo.price_kes),
                "delivered_at": sh.delivered_at.isoformat() if sh.delivered_at else None,
                "created_at": sh.created_at.isoformat() if sh.created_at else None,
            }
            for sh, lo, u in rows
        ],
    }


@router.patch("/shipments/{shipment_id}/resolve-dispute")
async def resolve_dispute(
    shipment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
) -> dict[str, Any]:
    shipment = (await db.execute(select(Shipment).where(Shipment.id == shipment_id))).scalar_one_or_none()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")
    shipment.dispute_open = False
    await db.commit()
    return {"id": str(shipment.id), "dispute_open": False}


# ── Transactions ──────────────────────────────────────────────────────────────

@router.get("/transactions")
async def admin_list_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    tx_type: str | None = Query(None, alias="type"),
    tx_status: str | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
) -> dict[str, Any]:
    q = select(Transaction, Wallet, User).join(Wallet, Wallet.id == Transaction.wallet_id).join(User, User.id == Wallet.user_id)
    if tx_type:
        q = q.where(Transaction.transaction_type == tx_type)
    if tx_status:
        q = q.where(Transaction.status == tx_status)

    total = await db.scalar(select(func.count()).select_from(q.subquery()))
    rows = (await db.execute(
        q.order_by(Transaction.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )).all()

    return {
        "total": total or 0,
        "page": page,
        "limit": limit,
        "items": [
            {
                "id": str(tx.id),
                "user_name": u.full_name,
                "user_email": u.email,
                "user_role": str(u.role),
                "transaction_type": str(tx.transaction_type),
                "amount_kes": float(tx.amount_kes),
                "status": str(tx.status),
                "reference": tx.reference,
                "description": tx.description,
                "created_at": tx.created_at.isoformat() if tx.created_at else None,
            }
            for tx, w, u in rows
        ],
    }


# ── Trucks ────────────────────────────────────────────────────────────────────

@router.get("/trucks")
async def admin_list_trucks(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
) -> dict[str, Any]:
    q = select(Truck, User).join(User, User.id == Truck.owner_id)
    total = await db.scalar(select(func.count()).select_from(Truck))
    rows = (await db.execute(
        q.order_by(Truck.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )).all()

    return {
        "total": total or 0,
        "page": page,
        "limit": limit,
        "items": [
            {
                "id": str(tr.id),
                "owner_name": u.full_name,
                "owner_email": u.email,
                "registration_number": tr.registration_number,
                "truck_type": str(tr.truck_type),
                "capacity_tonnes": tr.capacity_tonnes,
                "make": tr.make,
                "model": tr.model,
                "year": tr.year,
                "is_active": tr.is_active,
                "is_driver_owned": tr.is_driver_owned,
                "current_latitude": tr.current_latitude,
                "current_longitude": tr.current_longitude,
                "created_at": tr.created_at.isoformat() if tr.created_at else None,
            }
            for tr, u in rows
        ],
    }


@router.patch("/trucks/{truck_id}/toggle-active")
async def toggle_truck_active(
    truck_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
) -> dict[str, Any]:
    truck = (await db.execute(select(Truck).where(Truck.id == truck_id))).scalar_one_or_none()
    if not truck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Truck not found")
    truck.is_active = not truck.is_active
    await db.commit()
    return {"id": str(truck.id), "is_active": truck.is_active}
