from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from app.repositories.user_repo import UserRepository
from app.repositories.wallet_repo import WalletRepository
from app.schemas.user import TokenResponse, UserRegister


async def register_user(payload: UserRegister, db: AsyncSession) -> TokenResponse:
    user_repo = UserRepository(db)
    if await user_repo.get_by_email(payload.email):
        raise ConflictError("Email already registered")
    if await user_repo.get_by_phone(payload.phone):
        raise ConflictError("Phone number already registered")

    user = await user_repo.create(
        email=payload.email,
        phone=payload.phone,
        full_name=payload.full_name,
        company_name=payload.company_name,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )

    wallet_repo = WalletRepository(db)
    await wallet_repo.create_wallet(user.id)

    return TokenResponse(
        access_token=create_access_token(str(user.id), user.role),
        refresh_token=create_refresh_token(str(user.id)),
    )


async def login_user(email: str, password: str, db: AsyncSession) -> TokenResponse:
    user_repo = UserRepository(db)
    user = await user_repo.get_by_email(email)
    if not user or not verify_password(password, user.hashed_password):
        raise UnauthorizedError("Invalid credentials")
    if not user.is_active:
        raise UnauthorizedError("Account is disabled")

    return TokenResponse(
        access_token=create_access_token(str(user.id), user.role),
        refresh_token=create_refresh_token(str(user.id)),
    )


async def refresh_tokens(refresh_token: str, db: AsyncSession) -> TokenResponse:
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError("Not a refresh token")
        user_id = payload["sub"]
    except (ValueError, KeyError):
        raise UnauthorizedError("Invalid refresh token")

    user_repo = UserRepository(db)
    import uuid
    user = await user_repo.get_by_id(uuid.UUID(user_id))
    if not user or not user.is_active:
        raise UnauthorizedError("User not found or inactive")

    return TokenResponse(
        access_token=create_access_token(str(user.id), user.role),
        refresh_token=create_refresh_token(str(user.id)),
    )
