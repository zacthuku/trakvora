import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger(__name__)


def _send_smtp(to: str, subject: str, html: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from_email
    msg["To"] = to
    msg.attach(MIMEText(html, "html"))
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
        if settings.smtp_tls:
            server.starttls()
        if settings.smtp_username:
            server.login(settings.smtp_username, settings.smtp_password)
        server.sendmail(settings.smtp_from_email, [to], msg.as_string())


def _otp_html(name: str, code: str, purpose: str = "sign in") -> str:
    return f"""
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8f9fa;border-radius:12px;">
      <h2 style="color:#041627;font-size:24px;margin-bottom:8px;">Your trakvora code</h2>
      <p style="color:#555;margin-bottom:24px;">Hi {name}, use this code to {purpose}:</p>
      <div style="background:#041627;color:#fe6a34;font-size:36px;font-weight:700;letter-spacing:12px;
                  text-align:center;padding:20px;border-radius:8px;margin-bottom:24px;">
        {code}
      </div>
      <p style="color:#888;font-size:13px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0;"/>
      <p style="color:#aaa;font-size:12px;">trakvora — East Africa Freight Exchange</p>
    </div>
    """


async def send_otp_email(to: str, code: str, name: str = "there", purpose: str = "sign in") -> None:
    logger.info(f"[OTP] {to} → {code}")

    if not settings.smtp_username:
        return

    try:
        html = _otp_html(name, code, purpose)
        await asyncio.to_thread(_send_smtp, to, "trakvora — Your verification code", html)
    except Exception as exc:
        logger.error(f"Failed to send OTP email to {to}: {exc}")
        # Don't raise — OTP is in logs, don't block login
