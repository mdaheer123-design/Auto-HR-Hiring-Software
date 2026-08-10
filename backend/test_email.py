import asyncio
from config import settings
from services.email_service import _send_via_smtp

async def test_email():
    print(f"Testing SMTP with {settings.SMTP_USER} on {settings.SMTP_HOST}:{settings.SMTP_PORT}")
    try:
        await _send_via_smtp(
            to_email=settings.SMTP_USER, # send to self
            subject="Test Email from Friday HR",
            html="<p>This is a test email.</p>",
            text="This is a test email."
        )
        print("Test email sent successfully!")
    except Exception as e:
        print(f"Test email failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_email())
