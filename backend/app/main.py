import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine
from app.routers import admin, auth, bids, drivers, health, inbox, loads, notifications, payments, shipments, stats, tracking, trucks, uploads, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs("/app/static/uploads/photos", exist_ok=True)
    os.makedirs("/app/static/uploads/docs", exist_ok=True)
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

app.mount("/static", StaticFiles(directory="/app/static", html=False), name="static")

app.include_router(health.router, tags=["health"])
app.include_router(uploads.router, tags=["uploads"])
app.include_router(admin.router, tags=["admin"])
app.include_router(stats.router, tags=["stats"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(loads.router, prefix="/loads", tags=["loads"])
app.include_router(bids.router, prefix="/bids", tags=["bids"])
app.include_router(shipments.router, prefix="/shipments", tags=["shipments"])
app.include_router(trucks.router, prefix="/trucks", tags=["trucks"])
app.include_router(drivers.router, prefix="/drivers", tags=["drivers"])
app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
app.include_router(inbox.router, prefix="/inbox", tags=["inbox"])
app.include_router(tracking.router, prefix="/ws", tags=["tracking"])
app.include_router(payments.router, prefix="/payments", tags=["payments"])
