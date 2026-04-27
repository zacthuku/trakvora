from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine
from app.routers import auth, bids, drivers, health, loads, payments, shipments, tracking, trucks, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()


app = FastAPI(
    title="trakvora API",
    description="Real-time freight exchange for East Africa",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(loads.router, prefix="/loads", tags=["loads"])
app.include_router(bids.router, prefix="/bids", tags=["bids"])
app.include_router(shipments.router, prefix="/shipments", tags=["shipments"])
app.include_router(trucks.router, prefix="/trucks", tags=["trucks"])
app.include_router(drivers.router, prefix="/drivers", tags=["drivers"])
app.include_router(tracking.router, prefix="/ws", tags=["tracking"])
app.include_router(payments.router, prefix="/payments", tags=["payments"])
