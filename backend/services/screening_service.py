"""
AI Screening service — Uses Gemini API to evaluate resume-JD fit.
Returns structured score, strengths, gaps, and summary.
"""
import json
from config import settings


import json
import httpx
import re
from config import settings


def _compute_fallback_match_score(resume_text: str, job_description: str, job_title: str) -> dict:
    """
    Compute a deterministic skill-overlap match score (0-100)
    when LLM API is unavailable.
    """
    resume_lower = resume_text.lower()
    jd_lower = (job_description + " " + job_title).lower()

    # Common tech keywords
    keywords = [
        "python", "java", "javascript", "typescript", "node.js", "nodejs", "react", "angular",
        "fastapi", "django", "flask", "express", "sql", "postgresql", "mysql", "mongodb",
        "aws", "azure", "docker", "kubernetes", "git", "rest api", "graphql", "html", "css",
        "data analysis", "pandas", "numpy", "tableau", "power bi", "excel", "machine learning",
        "spring boot", "c++", "c#", "devops", "ci/cd", "agile", "scrum"
    ]

    jd_keywords = [kw for kw in keywords if kw in jd_lower]
    if not jd_keywords:
        # Fallback to word set overlap
        jd_words = set(re.findall(r'\w{4,}', jd_lower))
        resume_words = set(re.findall(r'\w{4,}', resume_lower))
        overlap = len(jd_words.intersection(resume_words))
        score = min(95, max(15, int((overlap / max(1, len(jd_words))) * 100)))
        return {
            "score": score,
            "strengths": [f"Keyword match overlap: {score}%"],
            "gaps": ["Detailed LLM analysis unavailable"],
            "summary": f"Calculated fit score of {score}/100 based on text and skill overlap."
        }

    matched_keywords = [kw for kw in jd_keywords if kw in resume_lower]
    match_ratio = len(matched_keywords) / len(jd_keywords)
    score = int(match_ratio * 85) + (10 if len(matched_keywords) > 2 else 5)
    score = max(15, min(98, score))

    strengths = [f"Matched skill: {kw.capitalize()}" for kw in matched_keywords[:4]]
    missing_keywords = [kw for kw in jd_keywords if kw not in resume_lower]
    gaps = [f"Missing skill: {kw.capitalize()}" for kw in missing_keywords[:4]]

    return {
        "score": score,
        "strengths": strengths if strengths else ["Basic profile overlap"],
        "gaps": gaps if gaps else ["No major skill gaps identified"],
        "summary": f"Evaluated candidate fit score: {score}/100 based on required job skills match."
    }


async def screen_candidate(resume_text: str, job_description: str, job_title: str) -> dict:
    """
    Evaluate a candidate's resume against a job description using Gemini API.
    Returns: {"score": 0-100, "strengths": [...], "gaps": [...], "summary": "..."}
    """
    if not settings.GEMINI_API_KEY:
        print("[WARN] GEMINI_API_KEY missing — using fallback skill matching engine")
        return _compute_fallback_match_score(resume_text, job_description, job_title)

    prompt = f"""You are an expert HR recruiter performing resume screening.

Evaluate how well the candidate's resume matches the job description below.

## Job Title: {job_title}

## Job Description:
{job_description[:3000]}

## Candidate Resume:
{resume_text[:4000]}

## Instructions:
Analyze the resume against the job description and provide a structured evaluation.
Return your response as valid JSON with exactly this structure:

{{
    "score": <integer 0-100 representing overall fit>,
    "strengths": ["<strength 1>", "<strength 2>"],
    "gaps": ["<gap 1>", "<gap 2>"],
    "summary": "<one sentence assessment of the candidate's fit>"
}}

Scoring guide:
- 85-100: High match for key skills and experience required
- 60-84: Moderate match with some missing skills
- 0-59: Poor match / skill mismatch (e.g., Full Stack applying to Data Analyst)

Return ONLY valid JSON, no markdown formatting."""

    print(f"[INFO] Gemini API request firing for role '{job_title}'...")

    # 1. Try Gemini REST API
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 600}
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, timeout=20.0)
            print(f"[INFO] Gemini API response status: {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                raw_reply = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                print(f"[INFO] Gemini raw response: {raw_reply[:150]}...")

                if raw_reply.startswith("```"):
                    lines = raw_reply.split("\n")
                    raw_reply = "\n".join(lines[1:-1]) if lines[-1].startswith("```") else "\n".join(lines[1:])

                res_json = json.loads(raw_reply)
                score = max(0, min(100, int(res_json.get("score", 50))))
                print(f"[SUCCESS] Gemini fit score generated: {score}/100")

                return {
                    "score": score,
                    "strengths": res_json.get("strengths", [])[:5],
                    "gaps": res_json.get("gaps", [])[:5],
                    "summary": str(res_json.get("summary", ""))[:1000]
                }
    except Exception as e:
        print(f"[WARN] Gemini REST API call failed: {e}")

    # 2. Try google-genai SDK if available
    try:
        from google import genai
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        response_text = response.text.strip()
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1]) if lines[-1].startswith("```") else "\n".join(lines[1:])
        result = json.loads(response_text)
        score = max(0, min(100, int(result.get("score", 50))))
        print(f"[SUCCESS] Gemini SDK fit score generated: {score}/100")
        return {
            "score": score,
            "strengths": result.get("strengths", [])[:5],
            "gaps": result.get("gaps", [])[:5],
            "summary": str(result.get("summary", ""))[:1000]
        }
    except Exception as e:
        print(f"[WARN] Gemini SDK call failed: {e}")

    # 3. Smart skill-overlap fallback
    fallback_res = _compute_fallback_match_score(resume_text, job_description, job_title)
    print(f"[INFO] Using calculated skill match score: {fallback_res['score']}/100")
    return fallback_res
