import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import NotificationType
from app.repositories.notification_repo import NotificationRepository

_TRACKING_CONNECTIONS: dict[str, list] = {}


async def send_notification(
    user_id: uuid.UUID,
    notification_type: NotificationType,
    title: str,
    body: str,
    reference_id: uuid.UUID | None = None,
    reference_type: str | None = None,
    db: AsyncSession | None = None,
) -> None:
    if db:
        repo = NotificationRepository(db)
        await repo.create(
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            body=body,
            reference_id=reference_id,
            reference_type=reference_type,
        )


def register_tracking_connection(shipment_id: str, websocket) -> None:
    if shipment_id not in _TRACKING_CONNECTIONS:
        _TRACKING_CONNECTIONS[shipment_id] = []
    _TRACKING_CONNECTIONS[shipment_id].append(websocket)


def unregister_tracking_connection(shipment_id: str, websocket) -> None:
    if shipment_id in _TRACKING_CONNECTIONS:
        _TRACKING_CONNECTIONS[shipment_id].discard(websocket) if hasattr(
            _TRACKING_CONNECTIONS[shipment_id], "discard"
        ) else _TRACKING_CONNECTIONS[shipment_id].remove(websocket)


async def broadcast_location(shipment_id: str, data: dict) -> None:
    import json

    connections = _TRACKING_CONNECTIONS.get(shipment_id, [])
    dead = []
    for ws in connections:
        try:
            await ws.send_text(json.dumps(data))
        except Exception:
            dead.append(ws)
    for ws in dead:
        try:
            _TRACKING_CONNECTIONS[shipment_id].remove(ws)
        except ValueError:
            pass
