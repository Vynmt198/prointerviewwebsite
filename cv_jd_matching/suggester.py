"""
suggester.py — Ngày 3: Gợi ý chỉnh sửa CV theo STAR + JD keywords.

Architecture: mirror scorer.py — dùng Ollama local, không cần API key.
Gồm 3 tầng:
  1. rewrite_bullets()          — viết lại từng bullet theo STAR + embed JD keyword
  2. suggest_missing_skills()   — reframe tips + learning path cho missing skills
  3. generate_summary()         — executive summary tổng hợp

Ollama phải đang chạy tại localhost:11434.
"""

import json
import re
import httpx
from typing import Optional

OLLAMA_URL   = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "mistral:7b"    # đổi thành llama3.2:3b nếu VRAM ít

SYSTEM_PROMPT = """You are an expert resume coach. You MUST respond with valid JSON only.
No explanation, no markdown, no code fences. Pure JSON object."""


# ══════════════════════════════════════════════════════════════════════════════
# INTERNAL HELPERS (mirror scorer.py pattern)
# ══════════════════════════════════════════════════════════════════════════════

def _call_ollama(prompt: str, num_predict: int = 1200, timeout: int = 180) -> str:
    """
    Gọi Ollama /api/generate — stream=False để nhận full response 1 lần.
    num_predict cao hơn scorer.py vì suggestion output dài hơn.
    """
    payload = {
        "model":  OLLAMA_MODEL,
        "prompt": f"{SYSTEM_PROMPT}\n\n{prompt}",
        "stream": False,
        "options": {
            "temperature": 0.3,   # cao hơn scorer một chút để suggestion đa dạng hơn
            "top_p": 0.9,
            "num_predict": num_predict,
        }
    }

    try:
        r = httpx.post(OLLAMA_URL, json=payload, timeout=timeout)
        r.raise_for_status()
        return r.json()["response"]
    except httpx.ConnectError:
        raise ConnectionError(
            "Không kết nối được Ollama. "
            "Hãy chắc chắn Ollama đang chạy: 'ollama serve' hoặc mở app Ollama."
        )
    except httpx.TimeoutException:
        raise TimeoutError(
            f"Ollama không phản hồi sau {timeout}s. "
            "Model đang load lần đầu hoặc prompt quá dài."
        )


def _parse_json(raw: str, fallback: dict) -> dict:
    """
    Parse JSON từ LLM output. Dùng regex fallback như scorer.py.
    Nếu thất bại hoàn toàn thì trả fallback dict kèm _parse_error=True.
    """
    # Strip markdown fences nếu model vẫn thêm vào
    cleaned = re.sub(r"```(?:json)?", "", raw).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Tìm JSON block đầu tiên
    m = re.search(r'\{[\s\S]*\}', cleaned)
    if m:
        try:
            return json.loads(m.group())
        except json.JSONDecodeError:
            pass

    return {**fallback, "_parse_error": True, "_raw": raw[:300]}


# ══════════════════════════════════════════════════════════════════════════════
# TẦNG 1 — BULLET REWRITER
# ══════════════════════════════════════════════════════════════════════════════

def _build_bullet_prompt(
    bullets: list[dict],
    missing_skills: list[str],
    scores: dict,
    jd_text: str,
) -> str:
    """
    Xây prompt rewrite bullets.
    bullets: list[{id, original, section, company, matched_skills}]
    scores:  output từ scorer.py (dùng để biết dimension nào yếu nhất)
    """
    # Xác định dimension yếu để ưu tiên fix
    weak_dims = [
        k for k in ("clarity", "structure", "relevance", "credibility")
        if scores.get(k, {}).get("score", 10) < 6.0
    ]
    weakness_note = (
        f"Focus especially on fixing: {', '.join(weak_dims)}."
        if weak_dims else
        "All dimensions are decent; still improve STAR and keywords."
    )

    missing_str  = ", ".join(missing_skills[:15]) or "none"
    jd_snippet   = jd_text[:1200]
    bullets_json = json.dumps(bullets, ensure_ascii=False)

    return f"""You are rewriting resume bullet points to be stronger.

=== JOB DESCRIPTION (first 1200 chars) ===
{jd_snippet}

=== MISSING SKILLS (in JD but not in resume) ===
{missing_str}

=== SCORING CONTEXT ===
{weakness_note}

=== RULES ===
1. Follow STAR: Action verb → Situation/context (brief) → Measurable Result (numbers/% where possible)
2. Embed JD keywords naturally — do NOT force irrelevant ones
3. NEVER invent numbers or experiences that aren't implied by the original
4. If result is unknown, write "driving X outcome" instead of making up a number
5. Confidence = "high" if result is clear, "medium" if inferred, "low" if original lacks any result

=== BULLETS TO REWRITE ===
{bullets_json}

Respond with ONLY this JSON structure:
{{
  "rewritten_bullets": [
    {{
      "id": "<same id>",
      "original": "<exact original>",
      "rewritten": "<STAR rewrite with JD keywords>",
      "changes_made": ["change 1", "change 2"],
      "star_check": {{"situation": true, "action": true, "result": true}},
      "keywords_added": ["kw1", "kw2"],
      "confidence": "high|medium|low"
    }}
  ]
}}"""


def rewrite_bullets(
    bullets: list[dict],
    missing_skills: list[str],
    scores: dict,
    jd_text: str,
    model: Optional[str] = None,
) -> dict:
    """
    Rewrite toàn bộ bullets trong 1 LLM call.
    bullets: list[dict] từ Day 1 parser (có thể tự tạo nếu chưa có extractor riêng)

    Returns: {"rewritten_bullets": [...]}
    """
    global OLLAMA_MODEL
    if model:
        OLLAMA_MODEL = model

    if not bullets:
        return {"rewritten_bullets": []}

    prompt  = _build_bullet_prompt(bullets, missing_skills, scores, jd_text)
    raw     = _call_ollama(prompt, num_predict=1500)
    result  = _parse_json(raw, fallback={"rewritten_bullets": []})

    # Sanity: đảm bảo mỗi bullet có đủ fields
    for b in result.get("rewritten_bullets", []):
        b.setdefault("keywords_added", [])
        b.setdefault("changes_made",   [])
        b.setdefault("confidence",     "medium")
        b.setdefault("star_check",     {"situation": False, "action": True, "result": False})

    return result


# ══════════════════════════════════════════════════════════════════════════════
# TẦNG 2 — MISSING SKILLS SUGGESTER
# ══════════════════════════════════════════════════════════════════════════════

def _build_missing_prompt(
    missing_skills: list[str],
    cv_text: str,
    jd_text: str,
) -> str:
    cv_snippet = cv_text[:1800]
    jd_snippet = jd_text[:800]

    return f"""You are a career coach advising a job candidate on skill gaps.

=== CANDIDATE'S RESUME (first 1800 chars) ===
{cv_snippet}

=== JOB DESCRIPTION (first 800 chars) ===
{jd_snippet}

=== MISSING SKILLS ===
{json.dumps(missing_skills)}

For EACH missing skill, provide:
- reframe_tip: How to reframe EXISTING resume experience to partially demonstrate this skill.
  Be specific — reference actual content from the resume above.
  Write exactly "N/A" if no existing experience applies at all.
- acquisition_path: ONE concrete short-term action (course name, project idea, cert, contribution).
  Be specific — not generic advice like "take an online course".
- priority: "high" if clearly required by JD, "medium" if preferred, "low" if minor/nice-to-have
- estimated_effort: "1 week" | "2 weeks" | "1 month" | "3 months" | "6+ months"

Respond with ONLY this JSON:
{{
  "missing_skill_suggestions": [
    {{
      "skill": "<skill name>",
      "reframe_tip": "...",
      "acquisition_path": "...",
      "priority": "high|medium|low",
      "estimated_effort": "..."
    }}
  ]
}}"""


def suggest_missing_skills(
    missing_skills: list[str],
    cv_text: str,
    jd_text: str,
    model: Optional[str] = None,
) -> dict:
    """
    Returns {"missing_skill_suggestions": [...]}
    """
    global OLLAMA_MODEL
    if model:
        OLLAMA_MODEL = model

    if not missing_skills:
        return {"missing_skill_suggestions": []}

    prompt = _build_missing_prompt(missing_skills, cv_text, jd_text)
    raw    = _call_ollama(prompt, num_predict=1200)
    return _parse_json(raw, fallback={"missing_skill_suggestions": []})


# ══════════════════════════════════════════════════════════════════════════════
# TẦNG 3 — EXECUTIVE SUMMARY
# ══════════════════════════════════════════════════════════════════════════════

def _build_summary_prompt(
    matching: list[str],
    missing: list[str],
    scores: dict,
    rewritten_count: int,
) -> str:
    score_lines = "\n".join(
        f"  {k}: {v.get('score', 0)}/10 — {v.get('reason', '')}"
        for k, v in scores.items()
        if k in ("clarity", "structure", "relevance", "credibility")
    )
    total = len(matching) + len(missing)
    match_pct = round(len(matching) / total * 100) if total else 0

    return f"""Write a concise executive summary (3-4 sentences) for a resume review.

Skill match: {match_pct}% ({len(matching)} matched, {len(missing)} missing)
Bullets rewritten: {rewritten_count}

Dimension scores:
{score_lines}

Top matching skills: {', '.join(matching[:8])}
Critical missing skills: {', '.join(missing[:6])}

Rules:
- Tone: professional, honest, encouraging
- Mention overall fit percentage
- Name 2-3 specific strengths
- Name 1-2 most critical gaps
- End with one actionable next step

Respond with ONLY this JSON:
{{
  "summary": "3-4 sentence executive summary here"
}}"""


def generate_summary(
    matching: list[str],
    missing: list[str],
    scores: dict,
    rewritten_count: int,
    model: Optional[str] = None,
) -> str:
    """Returns plain string summary."""
    global OLLAMA_MODEL
    if model:
        OLLAMA_MODEL = model

    prompt = _build_summary_prompt(matching, missing, scores, rewritten_count)
    raw    = _call_ollama(prompt, num_predict=300)
    parsed = _parse_json(raw, fallback={"summary": raw[:400]})
    return parsed.get("summary", raw[:400])


# ══════════════════════════════════════════════════════════════════════════════
# MAIN ORCHESTRATOR — gọi từ main.py
# ══════════════════════════════════════════════════════════════════════════════

def generate_suggestions(
    cv_text:        str,
    jd_text:        str,
    cv_bullets:     list[dict],
    matching:       list[str],
    missing:        list[str],
    scores:         dict,
    model:          Optional[str] = None,
) -> dict:
    """
    Entry point chính — gọi từ FastAPI endpoint /analyze/suggestions.

    Args:
        cv_text:    raw text của CV (từ parse_pdf)
        jd_text:    raw text của JD (từ parse_pdf)
        cv_bullets: list[dict] mỗi dict gồm {id, original, section, company, matched_skills}
                    — xem _extract_bullets_from_text() bên dưới nếu chưa có extractor
        matching:   list skill đã match (từ compute_match)
        missing:    list skill còn thiếu (từ compute_match)
        scores:     dict output từ scorer.score_resume()
        model:      Ollama model name (override OLLAMA_MODEL)

    Returns:
        {
          "rewritten_bullets":         [...],
          "missing_skill_suggestions": [...],
          "executive_summary":         "..."
        }

    Raises:
        ConnectionError: Ollama chưa chạy
        TimeoutError:    Model load quá lâu
    """
    global OLLAMA_MODEL
    if model:
        OLLAMA_MODEL = model

    print("  [suggester] Step 1/3 — Rewriting bullets...")
    bullets_result = rewrite_bullets(cv_bullets, missing, scores, jd_text)

    print("  [suggester] Step 2/3 — Generating missing skill suggestions...")
    missing_result = suggest_missing_skills(missing, cv_text, jd_text)

    rewritten_count = len(bullets_result.get("rewritten_bullets", []))
    print(f"  [suggester] Step 3/3 — Generating summary ({rewritten_count} bullets rewritten)...")
    summary = generate_summary(matching, missing, scores, rewritten_count)

    return {
        "rewritten_bullets":          bullets_result.get("rewritten_bullets", []),
        "missing_skill_suggestions":  missing_result.get("missing_skill_suggestions", []),
        "executive_summary":          summary,
    }


# ══════════════════════════════════════════════════════════════════════════════
# UTILITY — tự extract bullets nếu Day 1 chưa có bullet extractor riêng
# ══════════════════════════════════════════════════════════════════════════════

def extract_bullets_from_text(cv_text: str) -> list[dict]:
    """
    Heuristic: tách các dòng bắt đầu bằng bullet char hoặc dash ra thành bullets.
    Dùng làm fallback nếu parser chưa trả về structured bullets.

    Format trả về tương thích với rewrite_bullets():
    [{ id, original, section, company, matched_skills }]
    """
    bullets = []
    current_section = "Experience"

    section_keywords = {
        "experience": "Experience",
        "work":       "Experience",
        "employment": "Experience",
        "education":  "Education",
        "project":    "Projects",
        "skill":      "Skills",
        "certif":     "Certifications",
        "summary":    "Summary",
        "objective":  "Summary",
    }

    for i, line in enumerate(cv_text.splitlines()):
        line_stripped = line.strip()

        # Phát hiện section header
        lower = line_stripped.lower()
        for kw, section in section_keywords.items():
            if kw in lower and len(line_stripped) < 40:
                current_section = section
                break

        # Nhận diện bullet lines
        is_bullet = (
            line_stripped.startswith(("•", "-", "–", "▪", "*", "◦"))
            or (len(line_stripped) > 20 and line.startswith("  ") and line_stripped[0].isupper())
        )

        if is_bullet and len(line_stripped) > 15:
            # Loại bỏ ký tự bullet đầu
            text = re.sub(r'^[•\-–▪\*◦]\s*', '', line_stripped)
            if text:
                bullets.append({
                    "id":             f"b{str(i).zfill(3)}",
                    "original":       text,
                    "section":        current_section,
                    "company":        "",          # có thể enrich sau
                    "matched_skills": [],          # có thể enrich từ skill_extractor
                })

    return bullets


# ══════════════════════════════════════════════════════════════════════════════
# CLI TEST
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys

    # Quick health check
    try:
        r = httpx.get("http://localhost:11434/api/tags", timeout=5)
        models = [m["name"] for m in r.json().get("models", [])]
        print(f"✓ Ollama running. Models: {models}")
    except Exception as e:
        print(f"✗ Ollama not running: {e}")
        sys.exit(1)

    sample_cv = """
    Software Engineer at ABC Corp (2021–2024)
    • Built REST APIs for internal services using Python and Flask
    • Optimized slow database queries, reducing report generation time
    • Deployed new features to production monthly using manual process

    Junior Developer at XYZ Startup (2019–2021)
    • Wrote unit tests for frontend codebase in JavaScript
    • Participated in daily standups and sprint planning
    • Fixed bugs reported by QA team
    """

    sample_jd = """
    Senior Backend Engineer
    Requirements:
    - 5+ years Python (FastAPI preferred)
    - AWS experience (Lambda, ECS, RDS)
    - Kubernetes and Docker
    - CI/CD (GitHub Actions or Jenkins)
    - System design: microservices, event-driven architecture
    - Strong communication and mentoring skills
    Nice to have: TypeScript, GraphQL
    """

    sample_bullets = extract_bullets_from_text(sample_cv)
    print(f"\nExtracted {len(sample_bullets)} bullets from sample CV")

    sample_matching = ["Python", "Flask", "REST API", "JavaScript"]
    sample_missing  = ["FastAPI", "AWS", "Kubernetes", "CI/CD", "Docker", "System Design", "TypeScript"]
    sample_scores   = {
        "clarity":     {"score": 6.5, "reason": "Clear but lacks specifics"},
        "structure":   {"score": 3.5, "reason": "STAR format absent in most bullets"},
        "relevance":   {"score": 5.0, "reason": "Some mismatch with JD"},
        "credibility": {"score": 5.0, "reason": "No metrics or quantifiable results"},
        "overall":     5.0,
        "summary":     "Decent foundation but needs stronger evidence.",
    }

    print("\nRunning full suggestion pipeline...\n")
    result = generate_suggestions(
        cv_text=sample_cv,
        jd_text=sample_jd,
        cv_bullets=sample_bullets,
        matching=sample_matching,
        missing=sample_missing,
        scores=sample_scores,
    )

    print("\n── Executive Summary ──")
    print(result["executive_summary"])

    print(f"\n── {len(result['rewritten_bullets'])} Rewritten Bullets ──")
    for b in result["rewritten_bullets"]:
        print(f"\n[{b['id']}] ORIGINAL:  {b['original']}")
        print(f"          REWRITTEN: {b['rewritten']}")
        print(f"          Keywords:  {b.get('keywords_added', [])}")
        print(f"          Confidence:{b.get('confidence')}")

    print(f"\n── {len(result['missing_skill_suggestions'])} Missing Skill Suggestions ──")
    for s in result["missing_skill_suggestions"]:
        print(f"\n• {s['skill']} [{s['priority']}] ~{s['estimated_effort']}")
        print(f"  Reframe: {s['reframe_tip']}")
        print(f"  Learn:   {s['acquisition_path']}")

    # Save output
    out = "day3_test_output.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"\n✓ Full output saved to {out}")