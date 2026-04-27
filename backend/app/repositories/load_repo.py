import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.load import Load, LoadStatus


class LoadRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, load_id: uuid.UUID) -> Load | None:
        result = await self.db.execute(select(Load).where(Load.id == load_id))
        return result.scalar_one_or_none()

    async def list_marketplace(
        self,
        cargo_type: str | None = None,
        corridor: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Load], int]:
        q = select(Load).where(Load.status == LoadStatus.available)
        if cargo_type:
            q = q.where(Load.cargo_type == cargo_type)
        if corridor:
            q = q.where(Load.corridor == corridor)
        count_q = select(Load).where(Load.status == LoadStatus.available)
        total_result = await self.db.execute(count_q)
        total = len(total_result.scalars().all())
        q = q.offset((page - 1) * page_size).limit(page_size).order_by(Load.created_at.desc())
        result = await self.db.execute(q)
        return result.scalars().all(), total

    async def list_by_shipper(self, shipper_id: uuid.UUID) -> list[Load]:
        result = await self.db.execute(select(Load).where(Load.shipper_id == shipper_id).order_by(Load.created_at.desc()))
        return result.scalars().all()

    async def create(self, **kwargs) -> Load:
        load = Load(**kwargs)
        self.db.add(load)
        await self.db.flush()
        await self.db.refresh(load)
        return load

    async def update(self, load: Load, **kwargs) -> Load:
        for key, value in kwargs.items():
            setattr(load, key, value)
        await self.db.flush()
        await self.db.refresh(load)
        return load
