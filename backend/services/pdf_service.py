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
<h3>Chief complaint</h3>
<p>{{ subjective.chief_complaint | default("Not available", true) }}</p>

<h3>History</h3>
<p>{{ subjective.history | default("Not available", true) }}</p>

<h3>Duration</h3>
<p>{{ subjective.duration | default("Not available", true) }}</p>

<h3>Symptoms</h3>
{% if subjective.symptoms and subjective.symptoms|length > 0 %}
<ul>
{% for s in subjective.symptoms %}
<li>{{ s }}</li>
{% endfor %}
</ul>
{% else %}
<p class="muted">None documented</p>
{% endif %}
</div>

<div class="section">
<h2>Objective</h2>
{% if objective.observations and objective.observations|length > 0 %}
<ul>
{% for o in objective.observations %}
<li>{{ o }}</li>
{% endfor %}
</ul>
{% else %}
<p class="muted">No physical examination data available</p>
{% endif %}
</div>

<div class="section">
<h2>Assessment</h2>
<p>{{ assessment.possible_condition | default("Not specified", true) }}</p>
</div>

<div class="section">
<h2>Plan</h2>

<h3>Medications</h3>
{% if plan.medications and plan.medications|length > 0 %}
<ul>
{% for med in plan.medications %}
<li>
{% if med is mapping %}
{{ med.name or med.type or "Medication" }}{% if med.purpose %} — {{ med.purpose }}{% endif %}
{% else %}
{{ med }}
{% endif %}
</li>
{% endfor %}
</ul>
{% else %}
<p class="muted">None specified</p>
{% endif %}

<h3>Advice</h3>
{% if plan.advice and plan.advice|length > 0 %}
<ul>
{% for item in plan.advice %}
<li>{{ item }}</li>
{% endfor %}
</ul>
{% else %}
<p class="muted">None specified</p>
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


def _normalize_soap(soap_json: dict[str, Any]) -> dict[str, Any]:
    """Ensure all sections exist; tolerate missing keys, nulls, and LLM error payloads."""
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

    symptoms = sub.get("symptoms")
    if not isinstance(symptoms, list):
        symptoms = []
    observations = obj.get("observations")
    if not isinstance(observations, list):
        observations = []
    medications = pln.get("medications")
    if not isinstance(medications, list):
        medications = []
    advice = pln.get("advice")
    if not isinstance(advice, list):
        advice = []

    return {
        "report_title": "Medical Consultation Report",
        "error": soap_json.get("error"),
        "subjective": {
            "chief_complaint": sub.get("chief_complaint"),
            "history": sub.get("history"),
            "duration": sub.get("duration"),
            "symptoms": symptoms,
        },
        "objective": {"observations": observations},
        "assessment": {"possible_condition": ass.get("possible_condition")},
        "plan": {"medications": medications, "advice": advice},
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
