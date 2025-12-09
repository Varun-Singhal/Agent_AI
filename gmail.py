from __future__ import annotations

import mimetypes
import os
import smtplib
from email.message import EmailMessage
from pathlib import Path
from dotenv import load_dotenv

from logger import get_logger

load_dotenv()
logging = get_logger("Email MCP")


class GmailConfigError(RuntimeError):
    """Raised when required Gmail configuration is missing."""


def _load_credentials() -> tuple[str, str]:
    user = os.getenv("GMAIL_USER")
    app_password = os.getenv("GMAIL_APP_PASSWORD")
    if not user or not app_password:
        raise GmailConfigError(
            "GMAIL_USER and/or GMAIL_APP_PASSWORD env vars are missing. "
            "Set them before sending email."
        )
    return user, app_password


def send_email_with_attachment(
    to_address: str,
) -> None:
    """Send an email with a single attachment via Gmail SMTP."""
    sender, app_password = _load_credentials()

    subject = "Hello from Gmail SMTP"
    body = "Please find the requested file attached."
    attachment_path = "app.log"

    attachment = Path(attachment_path)
    if not attachment.exists():
        raise FileNotFoundError(f"Attachment not found: {attachment}")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_address
    msg.set_content(body)

    mime_type, encoding = mimetypes.guess_type(attachment.name)
    maintype, subtype = ("application", "octet-stream")
    if mime_type:
        maintype, subtype = mime_type.split("/", 1)

    msg.add_attachment(
        attachment.read_bytes(),
        maintype=maintype,
        subtype=subtype,
        filename=attachment.name,
    )

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(sender, app_password)
        smtp.send_message(msg)
