import secrets
import uuid

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, UnauthorizedError, ValidationError
from app.core.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from app.models.user import UserRole
from app.repositories.otp_repo import OTPRepository
from app.repositories.user_repo import UserRepository
from app.repositories.wallet_repo import WalletRepository
from app.schemas.user import (
    GoogleNewUserResponse, OTPChannelRequiredResponse, OTPRequiredResponse,
    TokenResponse, UserRegister,
)
from app.services import email_service, sms_service


def _mask_email(email: str) -> str:
    user, domain = email.split("@")
    visible = user[:2]
    return f"{visible}{'*' * max(1, len(user) - 2)}@{domain}"


def _mask_phone(phone: str) -> str:
    if len(phone) <= 4:
        return phone
    return phone[:3] + "*" * (len(phone) - 6) + phone[-3:]


async def _dispatch_otp(user, channel: str, otp_repo: OTPRepository) -> tuple[str, str]:
    """Create OTP, send it, return (channel_used, masked_destination)."""
    code = await otp_repo.create(user.email)

    if channel == "sms" and user.phone:
        await sms_service.send_otp_sms(user.phone, code, user.full_name)
        return "sms", _mask_phone(user.phone)
    else:
        await email_service.send_otp_email(user.email, code, user.full_name)
        return "email", _mask_email(user.email)


async def register_user(payload: UserRegister, db: AsyncSession) -> OTPRequiredResponse:
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

    otp_repo = OTPRepository(db)
    code = await otp_repo.create(user.email)
    await email_service.send_otp_email(user.email, code, user.full_name, purpose="complete your registration")

    return OTPRequiredResponse(
        email=user.email,
        channel="email",
        destination=_mask_email(user.email),
    )


async def login_user(email: str, password: str, db: AsyncSession):
    user_repo = UserRepository(db)
    user = await user_repo.get_by_email(email)
    if not user or not verify_password(password, user.hashed_password):
        raise UnauthorizedError("Invalid credentials")
    if not user.is_active:
        raise UnauthorizedError("Account is disabled")

    otp_repo = OTPRepository(db)

    # Unverified accounts (just registered) — always email OTP for initial verification
    if not user.is_verified:
        code = await otp_repo.create(user.email)
        await email_service.send_otp_email(user.email, code, user.full_name)
        return OTPRequiredResponse(
            email=user.email,
            channel="email",
            destination=_mask_email(user.email),
        )

    # Verified but no channel set yet — first post-registration login
    if user.otp_channel is None:
        return OTPChannelRequiredResponse(
            email=user.email,
            phone_available=bool(user.phone),
        )

    # Verified + channel set — normal 2FA login
    channel_used, destination = await _dispatch_otp(user, user.otp_channel, otp_repo)
    return OTPRequiredResponse(
        email=user.email,
        channel=channel_used,
        destination=destination,
    )


async def send_otp_and_set_channel(email: str, channel: str, db: AsyncSession) -> OTPRequiredResponse:
    """Called after channel selection on first login. Saves preference and sends OTP."""
    user_repo = UserRepository(db)
    user = await user_repo.get_by_email(email)
    if not user or not user.is_active:
        # Don't reveal existence — just proceed silently
        return OTPRequiredResponse(email=email, channel=channel, destination="")

    if channel == "sms" and not user.phone:
        raise ValidationError("No phone number registered on this account.")

    # Persist channel preference
    await user_repo.update(user, otp_channel=channel)

    otp_repo = OTPRepository(db)
    channel_used, destination = await _dispatch_otp(user, channel, otp_repo)
    return OTPRequiredResponse(
        email=user.email,
        channel=channel_used,
        destination=destination,
    )


async def verify_otp(email: str, code: str, db: AsyncSession) -> TokenResponse:
    otp_repo = OTPRepository(db)
    valid = await otp_repo.verify(email, code)
    if not valid:
        raise ValidationError("Invalid or expired code. Please try again.")

    user_repo = UserRepository(db)
    user = await user_repo.get_by_email(email)
    if not user:
        raise UnauthorizedError("User not found")

    first_verify = not user.is_verified
    await user_repo.update(user, is_verified=True)

    if first_verify:
        await email_service.send_welcome_email(user.email, user.full_name, user.role.value)

    return TokenResponse(
        access_token=create_access_token(str(user.id), user.role),
        refresh_token=create_refresh_token(str(user.id)),
    )


async def resend_otp(email: str, db: AsyncSession) -> None:
    user_repo = UserRepository(db)
    user = await user_repo.get_by_email(email)
    if not user:
        return

    channel = user.otp_channel or "email"
    otp_repo = OTPRepository(db)
    await _dispatch_otp(user, channel, otp_repo)


async def google_auth(
    access_token: str,
    role: UserRole | None,
    db: AsyncSession,
) -> OTPRequiredResponse | GoogleNewUserResponse:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v1/userinfo",
            params={"access_token": access_token},
        )
    if resp.status_code != 200:
        raise UnauthorizedError("Invalid Google token")

    info = resp.json()
    if not info.get("verified_email", False):
        raise UnauthorizedError("Google email is not verified")

    email: str = info["email"]
    user_repo = UserRepository(db)
    user = await user_repo.get_by_email(email)

    if not user:
        if not role:
            return GoogleNewUserResponse(
                email=email,
                full_name=info.get("name", email.split("@")[0]),
                profile_photo_url=info.get("picture"),
            )
        user = await user_repo.create(
            email=email,
            phone=None,
            full_name=info.get("name", email.split("@")[0]),
            company_name=None,
            hashed_password=hash_password(secrets.token_urlsafe(32)),
            role=role,
            is_active=True,
            is_verified=True,
            profile_photo_url=info.get("picture"),
        )
        wallet_repo = WalletRepository(db)
        await wallet_repo.create_wallet(user.id)
        await db.commit()
        await email_service.send_welcome_email(user.email, user.full_name, user.role.value)

    if not user.is_active:
        raise UnauthorizedError("Account is disabled")

    otp_repo = OTPRepository(db)
    code = await otp_repo.create(user.email)
    await email_service.send_otp_email(user.email, code, user.full_name, purpose="sign in with Google")

    return OTPRequiredResponse(
        email=user.email,
        channel="email",
        destination=_mask_email(user.email),
    )


async def refresh_tokens(refresh_token: str, db: AsyncSession) -> TokenResponse:
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError
        user_id = payload["sub"]
    except (ValueError, KeyError):
        raise UnauthorizedError("Invalid refresh token")

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(uuid.UUID(user_id))
    if not user or not user.is_active:
        raise UnauthorizedError("User not found or inactive")

    return TokenResponse(
        access_token=create_access_token(str(user.id), user.role),
        refresh_token=create_refresh_token(str(user.id)),
    )
