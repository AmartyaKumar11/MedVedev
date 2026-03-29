"""SOAP JSON → HTML → PDF (clinical report)."""

from __future__ import annotations

import shutil
from pathlib import Path
from typing import Any

from jinja2 import Template

# Embedded template (no separate file). Matches SOAP shape from llm_service / soap_output.json.
_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<style>
body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 13.6px;
    padding: 30px;
    color: #222;
    line-height: 1.45;
}
h1 { font-size: 18.7px; margin-bottom: 8px; }
h2 {
    font-size: 13.6px;
    border-bottom: 1px solid #ccc;
    padding-bottom: 6px;
    margin-top: 22px;
}
h3 { font-size: 11.9px; margin: 12px 0 6px 0; }
.section { margin-bottom: 18px; }
.muted { color: #666; font-style: italic; }
ul { margin: 6px 0 6px 20px; padding: 0; }
li { margin: 4px 0; }
p { margin: 6px 0; }
.report-branding {
    margin: -30px -30px 24px -30px;
}
.report-head-banner {
    width: 100%;
    height: auto;
    display: block;
    vertical-align: bottom;
}
.physician-meta {
    padding: 14px 30px 4px 30px;
    font-size: 11.05px;
    color: #222;
    line-height: 1.4;
}
.physician-meta p { margin: 4px 0; }
.physician-name { font-size: 11.9px; }
</style>
</head>
<body>

<header class="report-branding">
<img class="report-head-banner" src="report-header.png" alt="BML Munjal University"/>
<div class="physician-meta">
<p class="physician-name"><strong>Dr. Amartya Kumar</strong></p>
<p class="physician-phone">Phone: 5648289288</p>
<p class="physician-address">BML Munjal University</p>
</div>
</header>

<h1>{{ report_title }}</h1>

{% if error %}
<p class="muted"><b>Note:</b> {{ error }}</p>
{% endif %}

<div class="section">
<h2>Subjective</h2>
{% if subjective.subsections and subjective.subsections|length > 0 %}
{% for block in subjective.subsections %}
<h3>{{ block.heading }}</h3>
{% if block.content %}
<p>{{ block.content }}</p>
{% endif %}
{% if block.bullets and block.bullets|length > 0 %}
<ul>
{% for b in block.bullets %}
<li>{{ b }}</li>
{% endfor %}
</ul>
{% endif %}
{% if not block.content and (not block.bullets or block.bullets|length == 0) %}
<p class="muted">Not documented</p>
{% endif %}
{% endfor %}
{% else %}
<p class="muted">No subjective data</p>
{% endif %}
</div>

<div class="section">
<h2>Objective</h2>
{% if objective.subsections and objective.subsections|length > 0 %}
{% for block in objective.subsections %}
<h3>{{ block.heading }}</h3>
{% if block.content %}
<p>{{ block.content }}</p>
{% endif %}
{% if block.bullets and block.bullets|length > 0 %}
<ul>
{% for b in block.bullets %}
<li>{{ b }}</li>
{% endfor %}
</ul>
{% endif %}
{% if not block.content and (not block.bullets or block.bullets|length == 0) %}
<p class="muted">Not documented</p>
{% endif %}
{% endfor %}
{% else %}
<p class="muted">No objective data</p>
{% endif %}
</div>

<div class="section">
<h2>Assessment</h2>
{% if assessment.subsections and assessment.subsections|length > 0 %}
{% for block in assessment.subsections %}
<h3>{{ block.heading }}</h3>
{% if block.content %}
<p>{{ block.content }}</p>
{% endif %}
{% if block.bullets and block.bullets|length > 0 %}
<ul>
{% for b in block.bullets %}
<li>{{ b }}</li>
{% endfor %}
</ul>
{% endif %}
{% if not block.content and (not block.bullets or block.bullets|length == 0) %}
<p class="muted">Not documented</p>
{% endif %}
{% endfor %}
{% else %}
<p class="muted">No assessment data</p>
{% endif %}
</div>

<div class="section">
<h2>Plan</h2>
{% if plan.subsections and plan.subsections|length > 0 %}
{% for block in plan.subsections %}
<h3>{{ block.heading }}</h3>
{% if block.content %}
<p>{{ block.content }}</p>
{% endif %}
{% if block.bullets and block.bullets|length > 0 %}
<ul>
{% for b in block.bullets %}
<li>{{ b }}</li>
{% endfor %}
</ul>
{% endif %}
{% if not block.content and (not block.bullets or block.bullets|length == 0) %}
<p class="muted">Not documented</p>
{% endif %}
{% endfor %}
{% else %}
<p class="muted">No plan data</p>
{% endif %}
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


def _normalize_soap(soap_json: dict[str, Any]) -> dict[str, Any]:
    """Build PDF context: prefer LLM ``subsections`` (dynamic headings); else derive from legacy shapes."""
    if not isinstance(soap_json, dict):
        soap_json = {}

    sub = soap_json.get("subjective")
    sub = sub if isinstance(sub, dict) else {}
    obj = soap_json.get("objective")
    obj = obj if isinstance(obj, dict) else {}
    ass = soap_json.get("assessment")
    ass = ass if isinstance(ass, dict) else {}
    pln = soap_json.get("plan")
    pln = pln if isinstance(pln, dict) else {}

    hpi = sub.get("history_of_present_illness")
    hpi = hpi if isinstance(hpi, dict) else {}

    history = sub.get("history")
    if history is None or (isinstance(history, str) and not history.strip()):
        bits: list[str] = []
        desc = hpi.get("description")
        if desc:
            bits.append(str(desc).strip())
        for label, key in (
            ("Onset", "onset"),
            ("Duration", "duration"),
            ("Progression", "progression"),
            ("Severity", "severity"),
        ):
            v = hpi.get(key)
            if v is not None and str(v).strip():
                bits.append(f"{label}: {v}".strip())
        history = " ".join(bits) if bits else None

    duration = sub.get("duration")
    if duration is None or (isinstance(duration, str) and not str(duration).strip()):
        d = hpi.get("duration")
        duration = d if d is not None and str(d).strip() else None

    symptoms = _dedupe_preserve(
        _coerce_str_list(sub.get("symptoms"))
        + _coerce_str_list(hpi.get("associated_symptoms"))
    )
    ros = sub.get("review_of_systems")
    if isinstance(ros, dict):
        for key in ("gastrointestinal", "general", "others"):
            symptoms.extend(_coerce_str_list(ros.get(key)))
    symptoms = _dedupe_preserve(symptoms)

    observations = _coerce_str_list(obj.get("observations"))
    if not observations:
        observations = _coerce_str_list(obj.get("physical_exam"))

    vitals = obj.get("vitals")
    if isinstance(vitals, dict):
        vparts: list[str] = []
        for key, lab in (
            ("blood_pressure", "BP"),
            ("heart_rate", "HR"),
            ("temperature", "Temp"),
            ("respiratory_rate", "RR"),
        ):
            val = vitals.get(key)
            if val is not None and str(val).strip():
                vparts.append(f"{lab} {val}")
        if vparts:
            observations.insert(0, "Vitals: " + ", ".join(vparts))

    notes = obj.get("notes")
    if notes is not None and str(notes).strip():
        observations.append(f"Notes: {str(notes).strip()}")

    possible = ass.get("possible_condition")
    if possible is None or (isinstance(possible, str) and not possible.strip()):
        pd = ass.get("primary_diagnosis")
        possible = pd if pd is not None and str(pd).strip() else None
    if possible is None:
        diff = ass.get("differential_diagnoses")
        if isinstance(diff, list) and diff:
            possible = "; ".join(_coerce_str_list(diff))

    medications = pln.get("medications")
    if not isinstance(medications, list):
        medications = []

    advice = _coerce_str_list(pln.get("advice"))
    if not advice:
        advice = _coerce_str_list(pln.get("lifestyle_advice"))

    investigations = _coerce_str_list(pln.get("investigations"))
    procedures = _coerce_str_list(pln.get("procedures"))
    fu = pln.get("follow_up")
    follow_up = str(fu).strip() if fu is not None and str(fu).strip() else None
    ref = pln.get("referral")
    referral = str(ref).strip() if ref is not None and str(ref).strip() else None

    sub_sub = _coerce_subsections(sub.get("subsections"))
    if not sub_sub:
        sub_sub = _legacy_subjective_subsections(
            sub.get("chief_complaint"), history, duration, symptoms
        )

    obj_sub = _coerce_subsections(obj.get("subsections"))
    if not obj_sub:
        if observations:
            obj_sub = [
                {
                    "heading": "Examination findings",
                    "content": None,
                    "bullets": observations,
                }
            ]
        else:
            obj_sub = []

    ass_sub = _coerce_subsections(ass.get("subsections"))
    if not ass_sub:
        if possible is not None and str(possible).strip():
            ass_sub = [
                {"heading": "Impression", "content": str(possible).strip(), "bullets": []}
            ]
        else:
            cr = ass.get("clinical_reasoning")
            if cr is not None and str(cr).strip():
                ass_sub = [
                    {
                        "heading": "Clinical reasoning",
                        "content": str(cr).strip(),
                        "bullets": [],
                    }
                ]
            else:
                ass_sub = []

    plan_sub = _coerce_subsections(pln.get("subsections"))
    if not plan_sub:
        plan_sub = _legacy_plan_subsections(
            medications, advice, investigations, procedures, follow_up, referral
        )

    return {
        "report_title": "Medical Consultation Report",
        "error": soap_json.get("error"),
        "subjective": {"subsections": sub_sub},
        "objective": {"subsections": obj_sub},
        "assessment": {"subsections": ass_sub},
        "plan": {"subsections": plan_sub},
    }


def generate_pdf(soap_json: dict[str, Any]) -> bytes:
    """
    Render SOAP JSON to a PDF document (bytes).

    Expects the same structure as ``soap_output.json`` from ``llm_service``.
    """
    output_path = _ensure_header_image_for_pdf()
    ctx = _normalize_soap(soap_json)
    rendered_html = Template(_HTML_TEMPLATE).render(**ctx)

    from weasyprint import HTML

    base_url = output_path.resolve().as_uri() + "/"
    return HTML(string=rendered_html, base_url=base_url).write_pdf()
