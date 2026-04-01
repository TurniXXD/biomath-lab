from __future__ import annotations

import smtplib
from email.message import EmailMessage
from pathlib import Path

from app.pubmed import load_settings


def send_pdf_to_kindle(pdf_path: Path) -> str:
    settings = load_settings()

    if not settings.smtp_host or not settings.smtp_username or not settings.smtp_password:
        raise RuntimeError("SMTP settings are incomplete.")
    if not settings.kindle_recipient or not settings.kindle_sender:
        raise RuntimeError("KINDLE_RECIPIENT and KINDLE_SENDER must be configured.")

    message = EmailMessage()
    message["Subject"] = "BioMath Publications Digest"
    message["From"] = settings.kindle_sender
    message["To"] = settings.kindle_recipient
    message.set_content("Attached: latest science publications digest for Kindle delivery.")

    with pdf_path.open("rb") as file_obj:
        message.add_attachment(
            file_obj.read(),
            maintype="application",
            subtype="pdf",
            filename=pdf_path.name,
        )

    if settings.smtp_use_tls:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(message)
    else:
        with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port) as server:
            server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(message)

    return settings.kindle_recipient
