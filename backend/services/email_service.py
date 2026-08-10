"""
Email service — SendGrid (preferred) with SMTP fallback.
Sends notification emails when HR shortlists or selects a candidate.
"""
from datetime import datetime
from typing import Optional
from config import settings


async def send_selection_email(
    candidate_email: str,
    candidate_name: str,
    job_title: str,
    company_name: str = "Friday HR",
    interview_time: Optional[datetime] = None,
    interview_link: Optional[str] = None,
    action: str = "selected",
):
    """
    Send a shortlist or selection notification email to the candidate.
    Uses SendGrid if API key is available, otherwise falls back to SMTP.
    """
    if action == "shortlisted":
        subject = f"Congratulations! You have been shortlisted for {job_title}"
    else:
        subject = f"Congratulations! You have been selected for {job_title}"

    # Build interview details section
    interview_section = ""
    interview_text = ""
    if interview_time or interview_link:
        time_str = interview_time.strftime("%B %d, %Y at %I:%M %p UTC") if interview_time else "To be scheduled"
        link_str = f'<a href="{interview_link}" style="color: #1B6B63; text-decoration: none; font-weight: bold;">{interview_link}</a>' if interview_link else "Link will be shared soon"
        interview_section = f"""
                <div style="background: #E4F0EE; border: 1px solid #1B6B63; border-radius: 12px; padding: 16px; margin: 16px 0;">
                    <h3 style="color: #1B6B63; margin: 0 0 8px 0; font-size: 14px;">Interview Details</h3>
                    <p style="margin: 4px 0; color: #1F2430; font-size: 13px;"><strong>Date & Time:</strong> {time_str}</p>
                    <p style="margin: 4px 0; color: #1F2430; font-size: 13px;"><strong>Meeting Link:</strong> {link_str}</p>
                </div>
        """
        interview_text = f"\nInterview Date: {time_str}\nMeeting Link: {interview_link or 'TBD'}\n"

    if action == "shortlisted":
        body_text = f"""We are pleased to inform you that you have been <strong>shortlisted</strong> for the position of 
        <span style="color: #1B6B63; font-weight: 600;">{job_title}</span> at 
        <span style="color: #1B6B63; font-weight: 600;">{company_name}</span>.</p>
        <p>Your profile stood out among many applicants. Our hiring team will be reaching out to you soon regarding the next steps in the selection process."""
    else:
        body_text = f"""Congratulations! We're pleased to inform you that you have been <strong>selected</strong> for the 
        <span style="color: #1B6B63; font-weight: 600;">{job_title}</span> position at 
        <span style="color: #1B6B63; font-weight: 600;">{company_name}</span>.</p>
        <p>Your skills and experience stood out to our hiring team, and we're excited to move forward with you.</p>
        <p><strong>Next steps:</strong><br>
        Our HR team will reach out shortly with details regarding your offer letter, joining formalities, and onboarding schedule. Please keep an eye on your inbox over the next few days.</p>
        <p>If you have any questions in the meantime, feel free to reply directly to this email — we're happy to help.</p>
        <p>Once again, congratulations, and welcome aboard!</p>"""

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #FAF8F3; color: #1F2430; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 40px auto; background: #FFFFFF; border-radius: 16px; padding: 40px; border: 1px solid #E4DFD3; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
            .header {{ text-align: center; margin-bottom: 30px; border-b: 2px solid #E4F0EE; padding-bottom: 20px; }}
            .header h1 {{ color: #1B6B63; font-size: 28px; margin: 0; font-family: Georgia, serif; }}
            .badge {{ display: inline-block; background: #1B6B63; color: white; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-top: 10px; }}
            .content {{ line-height: 1.8; color: #1F2430; font-size: 15px; }}
            .highlight {{ color: #1B6B63; font-weight: 600; }}
            .footer {{ margin-top: 35px; padding-top: 20px; border-top: 1px solid #E4DFD3; text-align: center; color: #6B6A63; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Friday HR</h1>
                <span class="badge">{'Shortlist' if action == 'shortlisted' else 'Selection'} Notification</span>
            </div>
            <div class="content">
                <p>Dear <span class="highlight">{candidate_name}</span>,</p>
                {body_text}
                {interview_section}
                <p style="margin-top: 25px;">Best regards,<br>
                <span class="highlight">{company_name} · Hiring Team</span></p>
            </div>
            <div class="footer">
                <p>This email was sent by {company_name} Hiring Platform.<br>
                Powered by Friday HR 2026</p>
            </div>
        </div>
    </body>
    </html>
    """

    action_label = "shortlisted" if action == "shortlisted" else "selected"
    if action == "shortlisted":
        text_content = f"""Dear {candidate_name},

We are pleased to inform you that you have been shortlisted for the position of {job_title} at {company_name}.

Your profile stood out among many applicants. Our hiring team will be reaching out to you soon regarding the next steps in the selection process.
{interview_text}
If you have any questions, feel free to reply directly to this email.

Best regards,
{company_name} · Hiring Team
"""
    else:
        text_content = f"""Dear {candidate_name},

Congratulations! We're pleased to inform you that you have been selected for the {job_title} position at {company_name}.

Your skills and experience stood out to our hiring team, and we're excited to move forward with you.

Next steps:
Our HR team will reach out shortly with details regarding your offer letter, joining formalities, and onboarding schedule. Please keep an eye on your inbox over the next few days.

If you have any questions in the meantime, feel free to reply directly to this email — we're happy to help.

Once again, congratulations, and welcome aboard!

Best regards,
{company_name} · Hiring Team
"""

    print(f"[INFO] Preparing to send {action_label} email to {candidate_email}...")
    print(f"[INFO] SMTP_USER configured: {'Yes (' + settings.SMTP_USER + ')' if settings.SMTP_USER else 'No'}")
    print(f"[INFO] SMTP_PASSWORD configured: {'Yes' if settings.SMTP_PASSWORD else 'No'}")
    print(f"[INFO] SENDGRID_API_KEY configured: {'Yes' if settings.SENDGRID_API_KEY else 'No'}")

    # Try SendGrid first
    if settings.SENDGRID_API_KEY:
        await _send_via_sendgrid(candidate_email, subject, html_content, text_content)
    # Fallback to SMTP
    elif settings.SMTP_USER and settings.SMTP_PASSWORD:
        await _send_via_smtp(candidate_email, subject, html_content, text_content)
    else:
        print(f"[ERROR] Email not configured! Neither SendGrid nor SMTP credentials found in .env")
        print(f"[ERROR] Set SMTP_USER and SMTP_PASSWORD in your .env file to enable email delivery")
        raise RuntimeError(
            f"Email not configured. Set SMTP_USER/SMTP_PASSWORD or SENDGRID_API_KEY in .env. "
            f"Would have sent {action_label} email to {candidate_email}."
        )


async def _send_via_sendgrid(to_email: str, subject: str, html: str, text: str):
    """Send email via SendGrid API."""
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail, Email, To, Content

        message = Mail(
            from_email=Email(settings.EMAIL_FROM, "Friday HR"),
            to_emails=To(to_email),
            subject=subject,
            html_content=html,
        )

        sg = SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
        response = sg.send(message)
        print(f"[SUCCESS] SendGrid email sent to {to_email}, status: {response.status_code}")

    except Exception as e:
        print(f"[ERROR] SendGrid failed: {e}")
        raise


async def _send_via_smtp(to_email: str, subject: str, html: str, text: str):
    """Send email via SMTP with proper UTF-8 encoding."""
    try:
        import aiosmtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
        from email.header import Header

        msg = MIMEMultipart("alternative")
        msg["Subject"] = Header(subject, "utf-8")
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to_email

        msg.attach(MIMEText(text, "plain", "utf-8"))
        msg.attach(MIMEText(html, "html", "utf-8"))

        errors, message = await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=False,
            start_tls=True,
            timeout=10,
        )
        
        if errors:
            raise RuntimeError(f"SMTP recipients refused: {errors}")
            
        print(f"[SUCCESS] SMTP email sent to {to_email}. Server response: {message}")

    except Exception as e:
        print(f"[ERROR] SMTP failed: {repr(e)}")
        raise
