import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.dependencies import get_current_user
from app.models.user import User

UPLOAD_BASE = "/app/static/uploads"
PHOTO_DIR = f"{UPLOAD_BASE}/photos"
DOC_DIR = f"{UPLOAD_BASE}/docs"

os.makedirs(PHOTO_DIR, exist_ok=True)
os.makedirs(DOC_DIR, exist_ok=True)

ALLOWED_PHOTOS = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_DOCS = {"application/pdf", "image/jpeg", "image/png"}
MAX_BYTES = 5 * 1024 * 1024  # 5 MB

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/photo")
async def upload_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_PHOTOS:
        raise HTTPException(400, "Only JPEG, PNG, or WebP images are accepted.")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(400, "File exceeds 5 MB limit.")
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "jpg"
    name = f"{uuid.uuid4()}.{ext}"
    with open(os.path.join(PHOTO_DIR, name), "wb") as f:
        f.write(data)
    return {"url": f"{BASE_URL}/static/uploads/photos/{name}"}


@router.post("/document")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_DOCS:
        raise HTTPException(400, "Only PDF, JPEG, or PNG files are accepted.")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(400, "File exceeds 5 MB limit.")
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "pdf"
    name = f"{uuid.uuid4()}.{ext}"
    with open(os.path.join(DOC_DIR, name), "wb") as f:
        f.write(data)
    return {"url": f"{BASE_URL}/static/uploads/docs/{name}"}
