import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.driver import Driver


class DriverRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user_id(self, user_id: uuid.UUID) -> Driver | None:
        result = await self.db.execute(select(Driver).where(Driver.user_id == user_id))
        return result.scalar_one_or_none()

    async def get_by_id(self, driver_id: uuid.UUID) -> Driver | None:
        result = await self.db.execute(select(Driver).where(Driver.id == driver_id))
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> Driver:
        driver = Driver(**kwargs)
        self.db.add(driver)
        await self.db.flush()
        await self.db.refresh(driver)
        return driver

    async def update(self, driver: Driver, **kwargs) -> Driver:
        for key, value in kwargs.items():
            if value is not None:
                setattr(driver, key, value)
        await self.db.flush()
        await self.db.refresh(driver)
        return driver
