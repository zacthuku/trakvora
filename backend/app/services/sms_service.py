import asyncio
import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_AT_SANDBOX_URL = "https://api.sandbox.africastalking.com/version1/messaging"
_AT_PROD_URL = "https://api.africastalking.com/version1/messaging"


def _at_url() -> str:
    return _AT_SANDBOX_URL if settings.africastalking_username == "sandbox" else _AT_PROD_URL


def _send_sms_sync(to: str, message: str) -> None:
    url = _at_url()
    headers = {
        "apiKey": settings.africastalking_api_key,
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    data = {
        "username": settings.africastalking_username,
        "to": to,
        "message": message,
    }
    with httpx.Client(timeout=10) as client:
        resp = client.post(url, headers=headers, data=data)
        resp.raise_for_status()


async def send_otp_sms(to: str, code: str, name: str = "there") -> None:
    message = f"trakvora: Your login code is {code}. Valid for 10 minutes. Do not share it."
    logger.info(f"[OTP-SMS] {to} → {code}")

    if not settings.africastalking_api_key:
        return

    try:
        await asyncio.to_thread(_send_sms_sync, to, message)
    except Exception as exc:
        logger.error(f"Failed to send OTP SMS to {to}: {exc}")
        # Don't raise — OTP is in logs, don't block login
