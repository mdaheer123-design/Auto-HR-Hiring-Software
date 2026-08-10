"""
Resume parser service — Affinda API integration.
Parses PDF/DOCX resumes into structured JSON data.
Falls back to basic text extraction if API key is not configured.
"""
import json
import os
from config import settings


async def parse_resume(file_path: str) -> tuple[str, str]:
    """
    Parse a resume file using RChilli or Affinda API.
    Returns (parsed_data_json, raw_text).
    Falls back to basic extraction if APIs are not configured.
    """
    if settings.RCHILLI_API_KEY:
        return await _parse_with_rchilli(file_path)
    elif settings.AFFINDA_API_KEY and settings.AFFINDA_WORKSPACE_ID:
        return await _parse_with_affinda(file_path)
    else:
        return await _parse_basic(file_path)


async def _parse_with_rchilli(file_path: str) -> tuple[str, str]:
    """Parse using RChilli v8 REST API."""
    import httpx
    import base64
    try:
        with open(file_path, "rb") as f:
            file_b64 = base64.b64encode(f.read()).decode('utf-8')
        
        payload = {
            "filedata": file_b64,
            "filename": os.path.basename(file_path),
            "userkey": settings.RCHILLI_USER_KEY or settings.RCHILLI_API_KEY,
            "version": "8.0.0",
            "subuserkey": settings.RCHILLI_API_KEY
        }
        
        async with httpx.AsyncClient() as client:
            resp = await client.post("https://rest.rchilli.com/RChilliPaas/api/v8/parseResumeBinary", json=payload, timeout=30.0)
            if resp.status_code == 200:
                data = resp.json()
                resume_data = data.get("ResumeParserData", {})
                parsed = {
                    "name": resume_data.get("Name", {}).get("FullName"),
                    "emails": [resume_data.get("Email", {}).get("EmailAddress")] if resume_data.get("Email") else [],
                    "phones": [p.get("Number") for p in resume_data.get("PhoneNumber", []) if isinstance(p, dict)],
                    "skills": [s.get("Skill") for s in resume_data.get("SkillKeywords", {}).get("SkillSet", []) if isinstance(s, dict)]
                }
                raw_text = resume_data.get("HtmlResume", "") or json.dumps(parsed)
                return json.dumps(parsed, default=str), raw_text
    except Exception as e:
        print(f"[WARN] RChilli parsing failed: {e}")
    return await _parse_basic(file_path)


async def _parse_with_affinda(file_path: str) -> tuple[str, str]:
    """Parse using Affinda API v3."""
    try:
        from affinda import AffindaAPI, TokenCredential

        credential = TokenCredential(token=settings.AFFINDA_API_KEY)
        client = AffindaAPI(credential=credential)

        with open(file_path, "rb") as f:
            doc = client.create_document(
                file=f,
                workspace=settings.AFFINDA_WORKSPACE_ID,
            )

        # Extract structured data
        parsed = {}
        raw_parts = []

        if doc and doc.data:
            data = doc.data

            # Extract name
            if hasattr(data, 'name') and data.name:
                name = data.name
                parsed["name"] = str(name.raw) if hasattr(name, 'raw') else str(name)
                raw_parts.append(f"Name: {parsed['name']}")

            # Extract emails
            if hasattr(data, 'emails') and data.emails:
                parsed["emails"] = [str(e) for e in data.emails]
                raw_parts.append(f"Email: {', '.join(parsed['emails'])}")

            # Extract phone numbers
            if hasattr(data, 'phone_numbers') and data.phone_numbers:
                parsed["phones"] = [str(p) for p in data.phone_numbers]
                raw_parts.append(f"Phone: {', '.join(parsed['phones'])}")

            # Extract skills
            if hasattr(data, 'skills') and data.skills:
                parsed["skills"] = [
                    str(s.name) if hasattr(s, 'name') else str(s)
                    for s in data.skills
                ]
                raw_parts.append(f"Skills: {', '.join(parsed['skills'])}")

            # Extract work experience
            if hasattr(data, 'work_experience') and data.work_experience:
                experiences = []
                for exp in data.work_experience:
                    entry = {}
                    if hasattr(exp, 'job_title') and exp.job_title:
                        entry["title"] = str(exp.job_title)
                    if hasattr(exp, 'organization') and exp.organization:
                        entry["company"] = str(exp.organization)
                    if hasattr(exp, 'job_description') and exp.job_description:
                        entry["description"] = str(exp.job_description)
                        raw_parts.append(str(exp.job_description))
                    experiences.append(entry)
                parsed["experience"] = experiences

            # Extract education
            if hasattr(data, 'education') and data.education:
                education = []
                for edu in data.education:
                    entry = {}
                    if hasattr(edu, 'organization') and edu.organization:
                        entry["institution"] = str(edu.organization)
                    if hasattr(edu, 'accreditation') and edu.accreditation:
                        entry["degree"] = str(edu.accreditation)
                    education.append(entry)
                parsed["education"] = education

            # Extract raw text
            if hasattr(data, 'raw_text') and data.raw_text:
                raw_parts.insert(0, str(data.raw_text))

        raw_text = "\n".join(raw_parts) if raw_parts else ""
        return json.dumps(parsed, default=str), raw_text

    except Exception as e:
        print(f"[WARN] Affinda parsing error: {e}")
        return await _parse_basic(file_path)


async def _parse_basic(file_path: str) -> tuple[str, str]:
    """
    Basic text extraction fallback.
    Attempts to read text from PDF or plain text files.
    """
    raw_text = ""
    ext = os.path.splitext(file_path)[1].lower()

    try:
        if ext == ".pdf":
            # Try pdfplumber for text extraction
            try:
                import pdfplumber
                with pdfplumber.open(file_path) as pdf:
                    pages = []
                    for page in pdf.pages:
                        text = page.extract_text()
                        if text:
                            pages.append(text)
                    raw_text = "\n".join(pages)
            except ImportError:
                # Fallback: read as binary and decode what we can
                with open(file_path, "rb") as f:
                    content = f.read()
                    raw_text = content.decode("utf-8", errors="ignore")
        else:
            # .doc/.docx — try python-docx
            try:
                import docx
                doc = docx.Document(file_path)
                raw_text = "\n".join([para.text for para in doc.paragraphs if para.text])
            except ImportError:
                with open(file_path, "r", errors="ignore") as f:
                    raw_text = f.read()
    except Exception as e:
        print(f"[WARN] Basic parsing failed: {e}")
        raw_text = f"[Could not extract text from {os.path.basename(file_path)}]"

    parsed = {"raw_text": raw_text[:5000]}  # Limit stored text
    return json.dumps(parsed, default=str), raw_text
