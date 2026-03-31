from pathlib import Path
from typing import Dict
from uuid import uuid4

from app.core.config import OUTPUT_DIR
from live_chunk_with_speaker import process_audio
from services.pdf_service import generate_pdf


def run_pipeline(audio_path: str, doctor_id: str) -> Dict:
    """
    Orchestrates full pipeline execution.
    """
    _ = doctor_id
    doctor_enroll_path = str((Path(__file__).resolve().parents[3] / "doctor-amartya.mp3"))
    result = process_audio(audio_path, doctor_enroll_path)

    pdf_bytes = generate_pdf(result["soap"])
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    pdf_filename = f"{uuid4().hex}.pdf"
    pdf_path = OUTPUT_DIR / pdf_filename
    with open(pdf_path, "wb") as f:
        f.write(pdf_bytes)

    return {
        "conversation": result["conversation"],
        "soap": result["soap"],
        "pdf_path": str(pdf_path),
    }

