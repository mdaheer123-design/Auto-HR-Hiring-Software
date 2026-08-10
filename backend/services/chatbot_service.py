"""
HR Chatbot service — Groq API with grounded context from Elasticsearch/DB.
Uses OpenAI-compatible SDK with Groq base URL.
"""
import json
import json
import httpx
from config import settings
from services.search_service import search_candidates_for_role


async def process_chat_message(message: str, db_context: dict = None) -> dict:
    """
    Process an HR natural-language query.
    1. Retrieve relevant candidates & metrics from Database/Elasticsearch
    2. Pass as grounded context to Gemini API (or Grok)
    3. Return natural-language response strictly grounded in DB data
    """
    # Check for keywords to decide if we need DB context
    keywords = ["candidate", "candidates", "role", "roles", "status", "skill", "skills", "job", "jobs", "application", "applications", "applicant", "applicants", "hire", "hiring"]
    needs_context = any(k in message.lower() for k in keywords)

    # ── Step 1: Retrieve grounded context from DB & Search (if needed) ──
    context_parts = []
    sources = []

    if needs_context:
        candidates = await search_candidates_for_role(message, k=10)

        if db_context:
            # Add metrics
            metrics = {
                "total_candidates": db_context.get("total_candidates"),
                "total_open_jobs": db_context.get("total_open_jobs"),
                "total_applications": db_context.get("total_applications"),
                "open_jobs": db_context.get("open_jobs")
            }
            context_parts.append(f"Real Database Metrics: {json.dumps(metrics, default=str)}")

            # Add actual candidate rows (up to 30)
            cand_rows = db_context.get("candidate_rows", [])
            if cand_rows:
                context_parts.append("\nFull Candidate List (Truncated to Top 30):")
                for r in cand_rows:
                    context_parts.append(
                        f"- Name: {r['name']} | Email: {r['email']} | Skills: {r['skills']} | Status: {r['status']} | Applied Job: {r['applied_job']}"
                    )
        
        if candidates:
            context_parts.append("\nSemantic Search Results (from Resumes):")
            for i, c in enumerate(candidates, 1):
                context_parts.append(
                    f"Candidate {i}: {c.get('name', 'Unknown')} | "
                    f"Email: {c.get('email', 'N/A')} | "
                    f"Skills: {c.get('skills', 'N/A')} | "
                    f"Status: {c.get('status', 'applied')} | "
                    f"Score: {c.get('_score', 0):.1f}"
                )
                sources.append({
                    "name": c.get("name", "Unknown"),
                    "email": c.get("email", ""),
                    "resume_id": c.get("resume_id"),
                    "user_id": c.get("user_id"),
                    "score": round(c.get("_score", 0), 2),
                })

    context = "\n".join(context_parts) if context_parts else ""

    system_prompt = """You are Friday, an AI HR assistant for the Friday HR hiring platform.
Your task is to help HR users by answering their questions.
Rules:
1. Answer naturally and conversationally. For greetings like 'hi', just respond politely and offer help. Do not include random stats for simple greetings.
2. If the user asks about candidates, roles, or stats, answer using ONLY the provided real database context.
3. You have access to the full candidate list provided below. When asked for names, list them directly from this data. Never say you don't have candidate information if candidate records were provided in this context. Note that the list may be truncated to the top 20-30 candidates if there are many records.
4. Be clear, professional, and concise."""

    if needs_context and context:
        user_prompt = f"Grounded Database Context:\n{context}\n\nHR Question: {message}"
    else:
        user_prompt = f"HR Question: {message}"

    # ── Step 2: Try Groq API if GROQ_API_KEY is configured ──
    if settings.GROQ_API_KEY:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
            completion = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
            )
            return {"reply": completion.choices[0].message.content, "sources": sources[:5]}
        except Exception as e:
            print(f"[WARN] Groq API error: {e}")

    # ── Step 3: Call Gemini API if GEMINI_API_KEY is configured (Fallback) ──
    if settings.GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": f"{system_prompt}\n\n{user_prompt}"}]
                    }
                ],
                "generationConfig": {"temperature": 0.2, "maxOutputTokens": 1000}
            }
            async with httpx.AsyncClient() as client:
                resp = await client.post(url, json=payload, timeout=20.0)
                if resp.status_code == 200:
                    data = resp.json()
                    reply = data["candidates"][0]["content"]["parts"][0]["text"]
                    return {"reply": reply, "sources": sources[:5]}
        except Exception as e:
            print(f"[WARN] Gemini API call error: {e}")

    # ── Step 4: Grounded Fallback if no LLM key provided ──
    if not needs_context:
        return {"reply": "Hi! I'm Friday, your HR co-pilot. I can help you find candidates, check job status, and more. How can I help you today?", "sources": []}

    reply_lines = [f"📊 **Database Grounded Answer for:** '{message}'\n"]
    if db_context:
        reply_lines.append(f"• **Open Roles:** {db_context.get('total_open_jobs', 0)}")
        reply_lines.append(f"• **Total Applicants:** {db_context.get('total_applications', 0)}")
        reply_lines.append(f"• **Registered Candidates:** {db_context.get('total_candidates', 0)}")
    
    if sources:
        reply_lines.append("\n**Matching Candidates in Database:**")
        for s in sources[:4]:
            reply_lines.append(f"- **{s['name']}** ({s['email']}) — Match Score: {s['score']}")

    return {
        "reply": "\n".join(reply_lines),
        "sources": sources[:5],
    }
