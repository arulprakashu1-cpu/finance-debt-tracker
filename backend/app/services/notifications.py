"""Multi-channel alert delivery (SMS / WhatsApp via Twilio, email via SendGrid).

Credentials are read from environment config; with no API keys set, send_*
calls are no-ops that just return False so the rest of the app keeps working
in local development without live notification accounts.
"""
from app.config import settings
from app.models import Alert


def send_whatsapp(message: str, to: str | None = None) -> bool:
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        return False
    from twilio.rest import Client

    client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
    client.messages.create(
        from_=settings.twilio_whatsapp_from,
        to=f"whatsapp:{to or settings.owner_whatsapp}",
        body=message,
    )
    return True


def send_sms(message: str, to: str | None = None) -> bool:
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        return False
    from twilio.rest import Client

    client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
    client.messages.create(
        from_=settings.twilio_sms_from,
        to=to or settings.owner_whatsapp,
        body=message,
    )
    return True


def send_email(subject: str, message: str, to: str | None = None) -> bool:
    if not settings.sendgrid_api_key:
        return False
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail

    mail = Mail(
        from_email=settings.sendgrid_from_email,
        to_emails=to or settings.owner_email,
        subject=subject,
        plain_text_content=message,
    )
    SendGridAPIClient(settings.sendgrid_api_key).send(mail)
    return True


def dispatch_alert(alert: Alert) -> bool:
    if alert.channel.value == "whatsapp":
        return send_whatsapp(alert.message)
    if alert.channel.value == "sms":
        return send_sms(alert.message)
    return send_email(subject="Finance Tracker Alert", message=alert.message)
