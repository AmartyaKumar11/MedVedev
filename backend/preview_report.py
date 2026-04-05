"""Render the prescription HTML template with sample data and open in browser."""
import pathlib, sys, webbrowser
sys.path.insert(0, str(pathlib.Path(__file__).parent))

from jinja2 import Template
from services.pdf_service import _HTML_TEMPLATE

sample = {
    "doctor_name": "Dr. Amartya Kumar",
    "doctor_quals": "MBBS, MD",
    "patient_name": "Devanjali Relan",
    "consultation_date": "05-04-2024, 11:42 am",
    "patient_age_gender": "32 / Female",
    "mpid": "1000000101357515",
    "weight": "65 kg",
    "pulse_rate": "84 bpm",
    "bp": "128/89 mm/hg",
    "notes": (
        "Follow up case of hypothyroidism - on treatment since March 2023\n"
        "HYPOTHYROIDISM ON 50MCG THYRONORM\n"
        "TSH: 4.6\n"
        "Vit D: Low\n"
        "Patient complains of fatigue and mild weight gain over the past 2 months."
    ),
    "treatment": (
        "TAB THYRONORM 50MCG ORALLY ONCE DAILY EMPTY STOMACH BEFORE BREAKFAST - TO CONTINUE\n"
        "SYP ARACHITOL 5ML ORALLY ONCE A WEEK X 3 MONTHS\n"
        "TAB PAN 40MG ORALLY SOS IN CASE OF ACIDITY\n"
        "NO ALCOHOLIC DRINK FOR 48 HRS"
    ),
    "investigations": (
        "TSH (repeat)\n"
        "Vitamin D levels\n"
        "USG Abdomen and Pelvis"
    ),
    "follow_up": "Follow up after 1 week for evaluation",
}

html = Template(_HTML_TEMPLATE).render(**sample)
out = pathlib.Path(__file__).parent / "output" / "preview.html"
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding="utf-8")
print(f"Preview written → {out.resolve()}")
webbrowser.open(out.resolve().as_uri())
