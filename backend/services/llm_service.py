"""LLM client for SOAP note generation (Moonshot Kimi or NVIDIA NIM / build.nvidia)."""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None  # type: ignore[misc, assignment]

_BACKEND_DIR = Path(__file__).resolve().parent.parent
if load_dotenv is not None:
    load_dotenv(_BACKEND_DIR / ".env")
    load_dotenv()  # cwd fallback

# OpenAI-compatible chat completions (NVIDIA NIM)
NVIDIA_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
DEFAULT_NVIDIA_MODEL = "meta/llama-3.1-8b-instruct"

# Moonshot (China)
MOONSHOT_CHAT_URL = "https://api.moonshot.cn/v1/chat/completions"
DEFAULT_MOONSHOT_MODEL = "moonshot-v1-8k"


def resolve_llm_endpoint(api_key: str) -> tuple[str, str]:
    """
    Return (chat_completions_url, model_name).

    - Keys from build.nvidia.com start with ``nvapi-`` → NVIDIA NIM endpoint.
    - ``LLM_PROVIDER=nvidia`` or ``moonshot`` overrides auto-detection.
    """
    p = os.environ.get("LLM_PROVIDER", "").strip().lower()
    if p == "moonshot":
        return MOONSHOT_CHAT_URL, DEFAULT_MOONSHOT_MODEL
    if p == "nvidia":
        model = os.environ.get("NVIDIA_LLM_MODEL", DEFAULT_NVIDIA_MODEL).strip()
        return NVIDIA_CHAT_URL, model or DEFAULT_NVIDIA_MODEL
    if api_key.startswith("nvapi-"):
        model = os.environ.get("NVIDIA_LLM_MODEL", DEFAULT_NVIDIA_MODEL).strip()
        return NVIDIA_CHAT_URL, model or DEFAULT_NVIDIA_MODEL
    return MOONSHOT_CHAT_URL, DEFAULT_MOONSHOT_MODEL


def _build_prompt(conversation_json: str) -> str:
    return """You are a clinical documentation assistant.

Convert the following doctor-patient conversation into a structured SOAP note.

STRICT RULES:
- Do NOT hallucinate
- Do NOT add medical advice beyond what is explicitly said
- Only extract information present in the conversation
- If data is missing, use empty arrays [] or null
- Normalize Hinglish or informal language into proper clinical English
- Output STRICT JSON only (no explanation, no markdown fences)
- Use "subsections" arrays for all four SOAP sections as defined in the SCHEMA

SECTION GUIDANCE:

SUBJECTIVE — Extract these sub-headings (only if content exists):
  - "Chief Complaint": the patient's main presenting issue (1-2 sentences)
  - "Past Medical History": known prior conditions, prior diagnoses, EXISTING ongoing medications
    e.g. "Known case of hypothyroidism on 50mcg Thyronorm since March 2023"
  - "History of Present Illness": onset, duration, progression, severity, location
  - "Associated Symptoms": other symptoms mentioned
  - "Social History": smoking, alcohol, occupation, family history

OBJECTIVE — Extract these sub-headings (only if data is present):
  - "Vitals": each as its own bullet — "Weight: X kg", "Pulse: X bpm", "BP: XXX/XX mmHg"
  - "Lab Values": any test results mentioned — "TSH: 4.6", "Vit D: Low", "HbA1c: 7.2%"
  - "Physical Examination": clinical exam findings (tenderness, guarding, etc.)

ASSESSMENT:
  - "Impression": primary diagnosis or working diagnosis (1-2 sentences)
  - "Differential Diagnoses": alternative diagnoses if discussed (as bullets)

PLAN — CRITICAL — Use these exact sub-headings:
  - "Medications": EACH bullet = one complete prescription line in FULL clinical format:
    "[FORM] [DRUG NAME] [STRENGTH] [ROUTE] [FREQUENCY] [DURATION] [SPECIAL INSTRUCTIONS]"
    Examples:
      "TAB THYRONORM 50MCG ORALLY ONCE DAILY EMPTY STOMACH BEFORE BREAKFAST - TO CONTINUE"
      "SYP ARACHITOL 5ML ORALLY ONCE A WEEK X 3 MONTHS"
      "CAP DOXYCYCLINE 100MG ORALLY TWICE DAILY X 7 DAYS WITH FOOD"
      "TAB PAN 40MG ORALLY SOS IN CASE OF ACIDITY"
    Extract EVERY medication mentioned including continuing ones.
  - "Advice": non-medication patient instructions as individual bullets
    e.g. "NO ALCOHOLIC DRINK FOR 48 HRS", "INCREASE WATER INTAKE", "REST"
  - "Investigations": SPECIFIC test/investigation names as individual bullets
    e.g. "USG Abdomen and Pelvis", "Complete Blood Count (CBC)", "TSH", "Vitamin D levels"
    Do NOT use vague terms like "further tests" — name each investigation specifically.
  - "Follow-up": single follow-up instruction as the content field
    e.g. "Follow up after 1 week for evaluation"

SCHEMA:
{
  "subjective": {
    "subsections": [
      {
        "heading": "Sub-heading chosen from guidance above",
        "content": "Narrative paragraph or null if only bullets used",
        "bullets": ["Bullet point; use [] if none"]
      }
    ]
  },
  "objective": {
    "subsections": [
      {
        "heading": "Vitals",
        "content": null,
        "bullets": ["Weight: X kg", "Pulse: X bpm", "BP: XXX/XX mmHg"]
      }
    ]
  },
  "assessment": {
    "subsections": [
      {
        "heading": "Impression",
        "content": "Diagnosis or working impression",
        "bullets": []
      }
    ]
  },
  "plan": {
    "subsections": [
      {
        "heading": "Medications",
        "content": null,
        "bullets": ["FULL PRESCRIPTION LINE per drug"]
      },
      {
        "heading": "Advice",
        "content": null,
        "bullets": ["Patient instruction"]
      },
      {
        "heading": "Investigations",
        "content": null,
        "bullets": ["Specific investigation name"]
      },
      {
        "heading": "Follow-up",
        "content": "Follow up instruction text",
        "bullets": []
      }
    ]
  },
  "meta": {
    "language_detected": "",
    "confidence": "",
    "notes": ""
  }
}

CONVERSATION:
""" + conversation_json


def _strip_markdown_fences(text: str) -> str:
    text = text.strip()
    if not text.startswith("```"):
        return text
    lines = text.split("\n")
    if lines and lines[0].startswith("```"):
        lines = lines[1:]
    while lines and lines[-1].strip() in ("```", "`"):
        lines = lines[:-1]
    return "\n".join(lines).strip()


def _extract_first_json_object(text: str) -> str | None:
    """Return the first balanced `{ ... }` substring (handles strings and escapes)."""
    start = text.find("{")
    if start < 0:
        return None
    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(text)):
        c = text[i]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
        else:
            if c == '"':
                in_str = True
            elif c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    return text[start : i + 1]
    return None


def _parse_llm_json_content(content: str) -> dict[str, Any] | None:
    """Parse strict JSON from LLM output; tolerate markdown fences and leading text."""
    raw = content.strip()
    variants = [
        _strip_markdown_fences(raw),
        raw,
    ]
    for v in variants:
        for candidate in (v, _extract_first_json_object(v) or ""):
            if not candidate.strip():
                continue
            try:
                out = json.loads(candidate)
                if isinstance(out, dict):
                    return out
            except json.JSONDecodeError:
                continue
    return None


def generate_soap_note(conversation: list[dict[str, Any]]) -> dict[str, Any]:
    """Call configured LLM API and return structured SOAP JSON or an error dict."""
    if load_dotenv is not None:
        load_dotenv(_BACKEND_DIR / ".env")
        load_dotenv(Path.cwd() / ".env")

    api_key = (
        os.environ.get("KIMI_API_KEY")
        or os.environ.get("MOONSHOT_API_KEY")
        or os.environ.get("NVIDIA_API_KEY")
        or ""
    ).strip()
    if not api_key:
        return {
            "error": (
                "API key not set (set KIMI_API_KEY, MOONSHOT_API_KEY, or "
                "NVIDIA_API_KEY in backend/.env)"
            )
        }

    url, model = resolve_llm_endpoint(api_key)

    conversation_json = json.dumps({"conversation": conversation}, ensure_ascii=False)
    prompt = _build_prompt(conversation_json)

    payload = {
        "model": model,
        "temperature": 0,
        "messages": [{"role": "user", "content": prompt}],
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            err_body = e.read().decode("utf-8")
        except Exception:
            err_body = str(e)
        return {"error": f"HTTP {e.code}: {err_body}"}
    except Exception as e:
        return {"error": str(e)}

    try:
        content = body["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as e:
        return {"error": f"Unexpected API response shape: {e}"}

    parsed = _parse_llm_json_content(content)
    if parsed is not None:
        return parsed
    return {"error": "Invalid JSON from LLM"}
