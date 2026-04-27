import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.truck import Truck


class TruckRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, truck_id: uuid.UUID) -> Truck | None:
        result = await self.db.execute(select(Truck).where(Truck.id == truck_id))
        return result.scalar_one_or_none()

    async def list_by_owner(self, owner_id: uuid.UUID) -> list[Truck]:
        result = await self.db.execute(
            select(Truck).where(Truck.owner_id == owner_id).order_by(Truck.created_at.desc())
        )
        return result.scalars().all()

    async def create(self, **kwargs) -> Truck:
        truck = Truck(**kwargs)
        self.db.add(truck)
        await self.db.flush()
        await self.db.refresh(truck)
        return truck

    async def update(self, truck: Truck, **kwargs) -> Truck:
        for key, value in kwargs.items():
            if value is not None:
                setattr(truck, key, value)
        await self.db.flush()
        await self.db.refresh(truck)
        return truck
