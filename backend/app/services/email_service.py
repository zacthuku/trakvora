import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger(__name__)

FROM_NO_REPLY = "no-reply@trakvora.com"
FROM_SUPPORT = "support@trakvora.com"
FROM_BILLING = "billing@trakvora.com"


def _send_smtp(to: str, subject: str, html: str, from_email: str = FROM_NO_REPLY) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = to
    msg.attach(MIMEText(html, "html"))
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
        if settings.smtp_tls:
            server.starttls()
        if settings.smtp_username:
            server.login(settings.smtp_username, settings.smtp_password)
        server.sendmail(settings.smtp_username or from_email, [to], msg.as_string())


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
        await asyncio.to_thread(_send_smtp, to, "trakvora — Your verification code", html, FROM_NO_REPLY)
    except Exception as exc:
        logger.error(f"Failed to send OTP email to {to}: {exc}")


def _welcome_html(name: str, role: str) -> str:
    role_lines = {
        "shipper": ("Post your first load", "Connect with vetted carriers across East Africa and move cargo with confidence."),
        "owner": ("Add your fleet", "List your trucks and start accepting loads from verified shippers."),
        "driver": ("Browse available loads", "Find loads near you and start earning on your own schedule."),
        "admin": ("Admin access granted", "Your trakvora admin account is ready."),
    }
    cta_label, tagline = role_lines.get(role, ("Get started", "Your trakvora account is ready."))

    return f"""
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:40px 32px;background:#f8f9fa;border-radius:12px;">
      <h1 style="color:#041627;font-size:26px;margin-bottom:4px;">Welcome to trakvora, {name}.</h1>
      <p style="color:#555;font-size:15px;margin-bottom:32px;">{tagline}</p>
      <div style="background:#041627;border-radius:8px;padding:24px 28px;margin-bottom:28px;">
        <p style="color:#fe6a34;font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin:0 0 8px;">
          Next step
        </p>
        <p style="color:#fff;font-size:17px;font-weight:600;margin:0;">{cta_label}</p>
      </div>
      <p style="color:#888;font-size:13px;">
        Questions? Reply to this email or write to
        <a href="mailto:support@trakvora.com" style="color:#fe6a34;">support@trakvora.com</a>.
      </p>
      <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0;"/>
      <p style="color:#aaa;font-size:12px;">trakvora — East Africa Freight Exchange</p>
    </div>
    """


async def send_welcome_email(to: str, name: str, role: str) -> None:
    logger.info(f"[Welcome] {to} role={role}")

    if not settings.smtp_username:
        return

    try:
        html = _welcome_html(name, role)
        await asyncio.to_thread(
            _send_smtp, to, f"Welcome to trakvora, {name.split()[0]}!", html, FROM_NO_REPLY
        )
    except Exception as exc:
        logger.error(f"Failed to send welcome email to {to}: {exc}")
