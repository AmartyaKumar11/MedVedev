"""Dynamic clinical report HTML -> PDF."""

from __future__ import annotations

import shutil
import re
from datetime import datetime
from pathlib import Path
from typing import Any

from jinja2 import Template

_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12.5px;
    padding: 28px 36px 36px 36px;
    color: #222;
    line-height: 1.5;
}

/* ── Header ── */
.header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 10px;
    border-bottom: 2.5px solid #c65a9b;
    margin-bottom: 10px;
}
.doctor-name {
    color: #c65a9b;
    font-size: 26px;
    font-style: italic;
    font-family: "Brush Script MT", "Segoe Script", cursive;
    line-height: 1.15;
    margin-bottom: 3px;
}
.doctor-quals {
    color: #c65a9b;
    font-size: 11.5px;
    font-weight: 700;
    margin-top: 3px;
}
.doctor-contact {
    color: #c65a9b;
    font-size: 11.5px;
    font-weight: 700;
    margin-top: 2px;
}
.brand-area {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
}
.brand-logo {
    font-size: 20px;
    font-weight: 700;
    color: #8b4582;
    letter-spacing: -0.5px;
}
.brand-c {
    color: #c65a9b;
    font-size: 26px;
    font-weight: 900;
}

/* ── Patient Info Grid ── */
.info-table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 0 0;
    font-size: 12px;
}
.info-table td {
    padding: 3px 6px 3px 0;
    vertical-align: top;
}
.info-label {
    font-weight: 700;
    width: 130px;
    color: #111;
}
.info-value {
    width: 250px;
    color: #333;
}

/* ── Vitals Table ── */
.vitals-table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 14px 0;
    font-size: 12px;
}
.vitals-table td {
    border: 1px solid #666;
    padding: 5px 10px;
}
.vitals-label {
    font-weight: 700;
    background: #fafafa;
    width: 105px;
}

/* ── Section Blocks ── */
.section {
    margin-top: 14px;
}
.section-title {
    font-weight: 700;
    font-size: 12.5px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-bottom: 5px;
}
.section-body {
    font-size: 12.5px;
    white-space: pre-wrap;
    line-height: 1.65;
    color: #222;
}
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="doctor-name">{{ doctor_name }}</div>
    {% if doctor_quals %}<div class="doctor-quals">{{ doctor_quals }}</div>{% endif %}
  </div>
</div>

<table class="info-table">
  <tr>
    <td class="info-label">Name</td><td class="info-value">{{ patient_name }}</td>
    <td class="info-label">Consultation date</td><td class="info-value">{{ consultation_date }}</td>
  </tr>
  <tr>
    <td class="info-label">Age / Gender</td><td class="info-value">{{ patient_age_gender }}</td>
    <td class="info-label"></td><td class="info-value"></td>
  </tr>
  <tr>
    <td class="info-label">MPID</td><td class="info-value">{{ mpid }}</td>
    <td class="info-label"></td><td class="info-value"></td>
  </tr>
</table>

<table class="vitals-table">
  <tr>
    <td class="vitals-label">Weight</td><td>{{ weight }}</td>
    <td class="vitals-label">Pulse Rate</td><td>{{ pulse_rate }}</td>
    <td class="vitals-label">B.P.</td><td>{{ bp }}</td>
  </tr>
</table>

<div class="section">
  <div class="section-title">Notes</div>
  <div class="section-body">{{ notes }}</div>
</div>

<div class="section">
  <div class="section-title">Treatment</div>
  <div class="section-body">{{ treatment }}</div>
</div>

<div class="section">
  <div class="section-title">Investigations</div>
  <div class="section-body">{{ investigations }}</div>
</div>

<div class="section">
  <div class="section-title">Follow Up</div>
  <div class="section-body">{{ follow_up }}</div>
</div>

</body>
</html>
"""

_HEADER_IMAGE_NAME = "Screenshot 2026-03-29 154516.png"
_HEADER_COPY_NAME = "report-header.png"


def _output_dir() -> Path:
    return Path(__file__).resolve().parent.parent / "output"


def _ensure_header_image_for_pdf() -> Path:
    """Copy banner asset into output/ so WeasyPrint can resolve a simple relative src."""
    repo_root = Path(__file__).resolve().parent.parent.parent
    src = repo_root / "assets" / _HEADER_IMAGE_NAME
    if not src.is_file():
        msg = f"Report header image not found: {src}"
        raise FileNotFoundError(msg)
    out = _output_dir()
    out.mkdir(parents=True, exist_ok=True)
    dest = out / _HEADER_COPY_NAME
    shutil.copy2(src, dest)
    return out


def _coerce_str_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        out: list[str] = []
        for item in value:
            if item is None:
                continue
            s = str(item).strip()
            if s:
                out.append(s)
        return out
    s = str(value).strip()
    return [s] if s else []


def _dedupe_preserve(items: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for x in items:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out


def _coerce_subsections(raw: Any) -> list[dict[str, Any]]:
    """Parse LLM `subsections` arrays into normalized blocks for the PDF template."""
    if not isinstance(raw, list):
        return []
    out: list[dict[str, Any]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        h = item.get("heading")
        heading = str(h).strip() if h is not None else ""
        c = item.get("content")
        if c is None:
            content: str | None = None
        else:
            cs = str(c).strip()
            content = cs if cs else None
        bullets = _dedupe_preserve(_coerce_str_list(item.get("bullets")))
        if not heading:
            if not content and not bullets:
                continue
            heading = "Details"
        if not content and not bullets:
            continue
        out.append({"heading": heading, "content": content, "bullets": bullets})
    return out


def _medication_lines(medications: Any) -> list[str]:
    if not isinstance(medications, list):
        return []
    lines: list[str] = []
    for med in medications:
        if isinstance(med, dict):
            name = med.get("name") or med.get("type") or "Medication"
            parts: list[str] = []
            for key in ("dosage", "duration", "purpose"):
                v = med.get(key)
                if v is not None and str(v).strip():
                    parts.append(str(v).strip())
            line = str(name).strip()
            if parts:
                line += " — " + "; ".join(parts)
            lines.append(line)
        else:
            s = str(med).strip()
            if s:
                lines.append(s)
    return lines


def _legacy_subjective_subsections(
    chief: Any, history: Any, duration: Any, symptoms: list[str]
) -> list[dict[str, Any]]:
    blocks: list[dict[str, Any]] = []
    if chief is not None and str(chief).strip():
        blocks.append({"heading": "Chief complaint", "content": str(chief).strip(), "bullets": []})
    if history is not None and str(history).strip():
        blocks.append({"heading": "History", "content": str(history).strip(), "bullets": []})
    if duration is not None and str(duration).strip():
        blocks.append({"heading": "Duration", "content": str(duration).strip(), "bullets": []})
    if symptoms:
        blocks.append({"heading": "Symptoms", "content": None, "bullets": symptoms})
    return blocks


def _legacy_plan_subsections(
    medications: Any,
    advice: list[str],
    investigations: list[str],
    procedures: list[str],
    follow_up: str | None,
    referral: str | None,
) -> list[dict[str, Any]]:
    blocks: list[dict[str, Any]] = []
    med_lines = _medication_lines(medications)
    if med_lines:
        blocks.append({"heading": "Medications", "content": None, "bullets": med_lines})
    if advice:
        blocks.append({"heading": "Advice", "content": None, "bullets": advice})
    if investigations:
        blocks.append({"heading": "Investigations", "content": None, "bullets": investigations})
    if procedures:
        blocks.append({"heading": "Procedures", "content": None, "bullets": procedures})
    if follow_up:
        blocks.append({"heading": "Follow-up", "content": follow_up, "bullets": []})
    if referral:
        blocks.append({"heading": "Referral", "content": referral, "bullets": []})
    return blocks


def _get_text_from_soap(soap_json: dict[str, Any], section: str) -> str:
    raw = soap_json.get(section)
    if isinstance(raw, str):
        return raw.strip()
    if isinstance(raw, dict):
        parts: list[str] = []
        subs = raw.get("subsections")
        if isinstance(subs, list):
            for s in subs:
                if not isinstance(s, dict):
                    continue
                h = str(s.get("heading", "")).strip()
                c = str(s.get("content", "")).strip()
                b = _coerce_str_list(s.get("bullets"))
                if h:
                    parts.append(h)
                if c:
                    parts.append(c)
                if b:
                    parts.extend([f"- {x}" for x in b])
        for key in ("notes", "summary", "chief_complaint", "history", "possible_condition", "follow_up"):
            v = raw.get(key)
            if v is not None and str(v).strip():
                parts.append(str(v).strip())
        return "\n".join(_dedupe_preserve(parts)).strip()
    return ""


def _flatten_notes_text(soap_json: dict[str, Any]) -> str:
    """Build the Notes block: subjective content (no heading labels) +
    any lab values from objective + assessment impression."""
    parts: list[str] = []

    # Subjective — content + bullets without printing heading labels
    subj = soap_json.get("subjective")
    if isinstance(subj, dict):
        for sub in _coerce_subsections(subj.get("subsections") or []):
            c = sub.get("content") or ""
            if c:
                parts.append(c)
            for b in sub.get("bullets", []):
                parts.append(b)

    # Objective — only Lab Values bullets go into Notes
    obj = soap_json.get("objective")
    if isinstance(obj, dict):
        for sub in _coerce_subsections(obj.get("subsections") or []):
            h = sub["heading"].lower()
            if any(k in h for k in ("lab", "result", "blood test", "test result")):
                for b in sub.get("bullets", []):
                    parts.append(b)

    # Assessment — impression goes into Notes
    assessment = soap_json.get("assessment")
    if isinstance(assessment, dict):
        for sub in _coerce_subsections(assessment.get("subsections") or []):
            h = sub["heading"].lower()
            if "impression" in h or "diagnos" in h:
                c = sub.get("content") or ""
                if c:
                    parts.append(c)
                for b in sub.get("bullets", []):
                    parts.append(b)

    return "\n".join(_dedupe_preserve([p for p in parts if p.strip()])).strip()


def _extract_plan_subsections(plan: Any) -> dict[str, str]:
    """Separate plan subsections into treatment (medications + advice),
    investigations, and follow-up text based on heading keywords."""
    MEDICATION_KEYS = frozenset({"medications", "medication", "drugs", "prescriptions", "rx"})
    ADVICE_KEYS = frozenset({"advice", "instructions", "patient instructions",
                             "recommendations", "lifestyle", "lifestyle advice"})
    INVESTIGATION_KEYS = frozenset({"investigations", "investigation", "tests", "labs",
                                    "diagnostics", "workup", "investigations ordered"})
    FOLLOWUP_KEYS = frozenset({"follow-up", "follow up", "followup", "review",
                               "next visit", "follow up instruction"})

    treatment_lines: list[str] = []
    investigation_lines: list[str] = []
    follow_up_lines: list[str] = []

    if not isinstance(plan, dict):
        return {"treatment": "", "investigations": "", "follow_up": ""}

    for sub in _coerce_subsections(plan.get("subsections") or []):
        heading_lc = sub["heading"].lower()
        content = sub.get("content") or ""
        bullets = sub.get("bullets", [])

        is_medication = heading_lc in MEDICATION_KEYS or any(
            k in heading_lc for k in ("medic", "drug", "prescri"))
        is_advice = heading_lc in ADVICE_KEYS or any(
            k in heading_lc for k in ("advice", "instruct", "recommend", "lifestyle"))
        is_investigation = heading_lc in INVESTIGATION_KEYS or any(
            k in heading_lc for k in ("invest", "test", "lab", "diagnos", "workup"))
        is_followup = heading_lc in FOLLOWUP_KEYS or any(
            k in heading_lc for k in ("follow", "review", "next visit"))

        if is_followup:
            if content:
                follow_up_lines.append(content)
            follow_up_lines.extend(bullets)
        elif is_investigation:
            if content:
                investigation_lines.append(content)
            investigation_lines.extend(bullets)
        elif is_medication or is_advice:
            if content:
                treatment_lines.append(content)
            treatment_lines.extend(bullets)
        else:
            # Unknown heading — fallback to treatment
            if content:
                treatment_lines.append(content)
            treatment_lines.extend(bullets)

    return {
        "treatment": "\n".join(ln for ln in treatment_lines if ln.strip()).strip(),
        "investigations": "\n".join(ln for ln in investigation_lines if ln.strip()).strip(),
        "follow_up": "\n".join(ln for ln in follow_up_lines if ln.strip()).strip(),
    }


_BP_RE = re.compile(r"\b(\d{2,3}\s*/\s*\d{2,3})\b")
_PULSE_RE = re.compile(r"\b(?:pulse|hr|heart rate)[:\s-]*(\d{2,3})\b", re.IGNORECASE)
_WEIGHT_RE = re.compile(r"\b(?:weight|wt)[:\s-]*(\d{2,3}(?:\.\d+)?)\s*(kg)?\b", re.IGNORECASE)


def _extract_vitals(text: str, soap_obj: dict[str, Any]) -> dict[str, str]:
    bp = "—"
    pulse = "—"
    weight = "—"

    # Regex extraction from raw conversation text
    m = _BP_RE.search(text)
    if m:
        bp = f"{m.group(1).replace(' ', '')} mm/hg"
    m = _PULSE_RE.search(text)
    if m:
        pulse = f"{m.group(1)} bpm"
    m = _WEIGHT_RE.search(text)
    if m:
        weight = f"{m.group(1)} kg"

    obj = soap_obj.get("objective")
    if isinstance(obj, dict):
        # Legacy dict format
        vitals = obj.get("vitals")
        if isinstance(vitals, dict):
            bp_val = vitals.get("blood_pressure")
            hr_val = vitals.get("heart_rate")
            wt_val = vitals.get("weight")
            if bp_val and str(bp_val).strip():
                bp = f"{str(bp_val).strip()} mm/hg"
            if hr_val and str(hr_val).strip():
                pulse = f"{str(hr_val).strip()} bpm"
            if wt_val and str(wt_val).strip():
                weight = f"{str(wt_val).strip()} kg"
        # New subsections format: parse "Vitals" subsection bullets
        for sub in _coerce_subsections(obj.get("subsections") or []):
            if "vital" not in sub["heading"].lower():
                continue
            for bullet in sub.get("bullets", []):
                bl = bullet.lower()
                if any(k in bl for k in ("bp:", "blood pressure:", "b.p.:")):
                    m2 = _BP_RE.search(bullet)
                    if m2:
                        bp = f"{m2.group(1).replace(' ', '')} mm/hg"
                elif any(k in bl for k in ("pulse:", "hr:", "heart rate:")):
                    m2 = _PULSE_RE.search(bullet)
                    if m2:
                        pulse = f"{m2.group(1)} bpm"
                elif any(k in bl for k in ("weight:", "wt:")):
                    m2 = _WEIGHT_RE.search(bullet)
                    if m2:
                        weight = f"{m2.group(1)} kg"

    return {"bp": bp, "pulse_rate": pulse, "weight": weight}


def _normalize_report_payload(payload: dict[str, Any]) -> dict[str, Any]:
    conversation = payload.get("conversation") or []
    soap_json = payload.get("soap") or {}
    text_blob = "\n".join(
        str(t.get("text", "")).strip()
        for t in conversation
        if isinstance(t, dict)
    )
    vitals = _extract_vitals(text_blob, soap_json if isinstance(soap_json, dict) else {})

    # Notes = subjective (complaints, past history, lab values) + assessment impression
    notes = _flatten_notes_text(soap_json if isinstance(soap_json, dict) else {})

    # Plan: split into treatment (medications+advice), investigations, follow-up
    plan = soap_json.get("plan") if isinstance(soap_json, dict) else None
    plan_parts = _extract_plan_subsections(plan)
    treatment = plan_parts["treatment"]
    investigations = plan_parts["investigations"]
    follow_up = plan_parts["follow_up"]

    # Fallback follow-up
    if not follow_up and isinstance(plan, dict):
        fu = plan.get("follow_up")
        if fu and str(fu).strip():
            follow_up = str(fu).strip()
    if not follow_up:
        follow_up = "Follow up after 1 week for evaluation"

    patient_name = str(payload.get("patient_name") or "—")
    patient_age = payload.get("patient_age")
    patient_gender = payload.get("patient_gender")
    age_gender = " / ".join(
        [x for x in [
            str(patient_age).strip() if patient_age is not None else "",
            str(patient_gender).strip() if patient_gender is not None else "",
        ] if x]
    ) or "—"

    consultation_date = payload.get("consultation_date")
    if not consultation_date:
        consultation_date = datetime.now().strftime("%d-%m-%Y, %I:%M %p")

    # Doctor info — comes from the logged-in doctor passed in the payload
    raw_doctor_name = payload.get("doctor_name") or ""
    doctor_name = str(raw_doctor_name).strip() or "—"
    # Auto-prefix "Dr." if not already present
    if doctor_name != "—" and not doctor_name.lower().startswith("dr"):
        doctor_name = f"Dr. {doctor_name}"
    doctor_quals = str(payload.get("doctor_quals") or "").strip()

    return {
        "patient_name": patient_name,
        "patient_age_gender": age_gender,
        "consultation_date": str(consultation_date),
        "mpid": str(payload.get("mpid") or payload.get("patient_id") or "—"),
        "weight": vitals["weight"],
        "pulse_rate": vitals["pulse_rate"],
        "bp": vitals["bp"],
        "notes": notes or "—",
        "treatment": treatment or "—",
        "investigations": investigations or "—",
        "follow_up": follow_up or "—",
        "doctor_name": doctor_name,
        "doctor_quals": doctor_quals,
    }


def generate_pdf(report_payload: dict[str, Any]) -> bytes:
    """
    Render SOAP JSON to a PDF document (bytes).

    Expects report payload with soap + conversation + patient/session metadata.
    """
    output_path = _ensure_header_image_for_pdf()
    ctx = _normalize_report_payload(report_payload)
    rendered_html = Template(_HTML_TEMPLATE).render(**ctx)

    from weasyprint import HTML

    base_url = output_path.resolve().as_uri() + "/"
    return HTML(string=rendered_html, base_url=base_url).write_pdf()
