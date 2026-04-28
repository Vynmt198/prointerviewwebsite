"""
scorer.py — Đánh giá CV theo 4 dimensions bằng Ollama local.

Không cần API key, không tốn tiền.
Ollama phải đang chạy tại localhost:11434 trước khi gọi hàm này.
"""

import json
import re
import httpx
from typing import Optional

OLLAMA_URL  = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "mistral:7b"   # đổi thành llama3.2:3b nếu VRAM ít


# ── Prompt builder ───────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an expert resume evaluator. You MUST respond with valid JSON only.
No explanation, no markdown, no code fences. Pure JSON object."""

def build_scoring_prompt(cv_text: str, jd_text: str, matching: list, missing: list) -> str:
    """
    Gộp toàn bộ context vào 1 prompt → 1 LLM call duy nhất.
    Trả về JSON với 4 dimension scores + lý do.
    """
    matching_str = ", ".join(matching[:20]) if matching else "none"
    missing_str  = ", ".join(missing[:20])  if missing  else "none"

    return f"""Evaluate this resume against the job description.

=== RESUME (first 2000 chars) ===
{cv_text[:2000]}

=== JOB DESCRIPTION (first 1500 chars) ===
{jd_text[:1500]}

=== SKILL ANALYSIS ===
Matching skills: {matching_str}
Missing skills: {missing_str}

=== TASK ===
Score the resume on these 4 dimensions (0.0 to 10.0 each):

1. CLARITY: Is the writing clear, concise, no vague buzzwords?
   Check: specific language, no filler phrases like "responsible for" or "assisted with"

2. STRUCTURE (STAR): Do bullet points follow Situation→Action→Result?
   Check: does each bullet have a measurable result (numbers, %, $, time)?
   Score higher if >50% of bullets have quantified results.

3. RELEVANCE: How well does the resume match this specific job?
   Check: skill overlap percentage, job title alignment, industry match.
   Use matching/missing skill data above.

4. CREDIBILITY: Are claims specific and verifiable?
   Check: company names, tool names, specific metrics, certifications.
   Penalize vague claims like "improved performance significantly".

Respond ONLY with this exact JSON structure:
{{
  "clarity": {{
    "score": 7.5,
    "reason": "one sentence explanation",
    "examples": ["specific quote or observation from resume"]
  }},
  "structure": {{
    "score": 6.0,
    "reason": "one sentence explanation",
    "star_found": true,
    "quantified_bullets": 3,
    "total_bullets": 8
  }},
  "relevance": {{
    "score": 8.0,
    "reason": "one sentence explanation",
    "match_percentage": 65.0
  }},
  "credibility": {{
    "score": 7.0,
    "reason": "one sentence explanation",
    "examples": ["specific credible claim found"]
  }},
  "overall": 7.1,
  "summary": "2-3 sentence overall assessment"
}}"""


# ── Ollama caller ────────────────────────────────────────────────────────────

def call_ollama(prompt: str, timeout: int = 120) -> str:
    """
    Gọi Ollama API (OpenAI-compatible endpoint).
    Dùng stream=False để nhận toàn bộ response 1 lần.
    """
    payload = {
        "model":  OLLAMA_MODEL,
        "prompt": f"{SYSTEM_PROMPT}\n\n{prompt}",
        "stream": False,
        "options": {
            "temperature": 0.1,   # thấp → output ổn định, ít hallucinate
            "top_p": 0.9,
            "num_predict": 800,   # đủ cho JSON output
        }
    }

    try:
        response = httpx.post(OLLAMA_URL, json=payload, timeout=timeout)
        response.raise_for_status()
        return response.json()["response"]
    except httpx.ConnectError:
        raise ConnectionError(
            "Không kết nối được Ollama. "
            "Hãy chắc chắn Ollama đang chạy: 'ollama serve' hoặc mở app Ollama."
        )
    except httpx.TimeoutException:
        raise TimeoutError(f"Ollama không phản hồi sau {timeout}s. Model có thể đang load lần đầu.")


# ── JSON parser ──────────────────────────────────────────────────────────────

def parse_score_json(raw: str) -> dict:
    """
    Parse JSON từ LLM output. LLM đôi khi thêm text thừa trước/sau JSON.
    Dùng regex để tìm phần JSON hợp lệ.
    """
    # Thử parse thẳng trước
    try:
        return json.loads(raw.strip())
    except json.JSONDecodeError:
        pass

    # Tìm block JSON đầu tiên trong output
    match = re.search(r'\{[\s\S]*\}', raw)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    # Fallback: trả về scores mặc định kèm lỗi
    return {
        "clarity":     {"score": 0, "reason": "Parse error"},
        "structure":   {"score": 0, "reason": "Parse error", "star_found": False,
                        "quantified_bullets": 0, "total_bullets": 0},
        "relevance":   {"score": 0, "reason": "Parse error", "match_percentage": 0},
        "credibility": {"score": 0, "reason": "Parse error", "examples": []},
        "overall":     0,
        "summary":     "Could not parse model output. Raw: " + raw[:200],
        "_parse_error": True,
    }


# ── Main entry point ─────────────────────────────────────────────────────────

def score_resume(
    cv_text:  str,
    jd_text:  str,
    matching: list,
    missing:  list,
    model:    Optional[str] = None,
) -> dict:
    """
    Entry point chính. Gọi từ main.py.

    Returns dict với scores theo 4 dimensions + overall + summary.
    Raises ConnectionError nếu Ollama chưa chạy.
    """
    global OLLAMA_MODEL
    if model:
        OLLAMA_MODEL = model

    prompt   = build_scoring_prompt(cv_text, jd_text, matching, missing)
    raw      = call_ollama(prompt)
    scores   = parse_score_json(raw)

    # Tính overall nếu model không trả về
    if "overall" not in scores or scores["overall"] == 0:
        dims = ["clarity", "structure", "relevance", "credibility"]
        vals = [scores.get(d, {}).get("score", 0) for d in dims]
        scores["overall"] = round(sum(vals) / len(vals), 1)

    return scores


# ── Health check helper ───────────────────────────────────────────────────────

def check_ollama_health(model: str = OLLAMA_MODEL) -> dict:
    """Kiểm tra Ollama đang chạy và model đã được pull chưa."""
    try:
        r = httpx.get("http://localhost:11434/api/tags", timeout=5)
        models = [m["name"] for m in r.json().get("models", [])]
        return {
            "running": True,
            "model_available": any(model in m for m in models),
            "available_models": models,
        }
    except Exception as e:
        return {"running": False, "error": str(e), "model_available": False}


# ── CLI test ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("Checking Ollama health...")
    health = check_ollama_health()
    print(json.dumps(health, indent=2))

    if not health["running"]:
        print("\nOllama chưa chạy! Mở PowerShell và chạy: ollama serve")
        exit(1)

    if not health["model_available"]:
        print(f"\nModel chưa được pull! Chạy: ollama pull {OLLAMA_MODEL}")
        exit(1)

    print("\nRunning test scoring...")
    result = score_resume(
        cv_text="Software engineer with 3 years Python experience. Built REST APIs with Django. "
                "Reduced API response time by 40% through caching. Led team of 3 developers.",
        jd_text="Looking for Python backend engineer. FastAPI or Django. AWS experience preferred. "
                "Must have experience with PostgreSQL and Redis.",
        matching=["python", "django"],
        missing=["fastapi", "aws", "postgresql", "redis"],
    )
    print(json.dumps(result, indent=2, ensure_ascii=False))