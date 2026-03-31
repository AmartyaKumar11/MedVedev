from pathlib import Path
from typing import Dict
from uuid import uuid4
from uuid import UUID

from app.core.config import OUTPUT_DIR
from app.db.models import Doctor, Patient, Report, SessionModel
from app.db.session import SessionLocal
from live_chunk_with_speaker import process_audio
from services.pdf_service import generate_pdf


def run_pipeline(audio_path: str, doctor_id: str, patient_name: str) -> Dict:
    """
    Orchestrates full pipeline execution.
    """
    patient_name_clean = patient_name.strip()
    if not patient_name_clean:
        raise ValueError("patient_name is required.")

    doctor_enroll_path = str((Path(__file__).resolve().parents[3] / "doctor-amartya.mp3"))
    result = process_audio(audio_path, doctor_enroll_path)

    pdf_bytes = generate_pdf(result["soap"])
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    pdf_filename = f"{uuid4().hex}.pdf"
    pdf_path = OUTPUT_DIR / pdf_filename
    with open(pdf_path, "wb") as f:
        f.write(pdf_bytes)

    try:
        doctor_uuid = UUID(doctor_id)
    except ValueError as e:
        raise ValueError("doctor_id must be a valid UUID.") from e

    with SessionLocal() as db:
        try:
            doctor = db.get(Doctor, doctor_uuid)
            if doctor is None:
                raise ValueError("Doctor not found.")

            patient = (
                db.query(Patient)
                .filter(Patient.doctor_id == doctor_uuid, Patient.name == patient_name_clean)
                .first()
            )
            if patient is None:
                patient = Patient(doctor_id=doctor_uuid, name=patient_name_clean)
                db.add(patient)
                db.flush()

            session_row = SessionModel(doctor_id=doctor_uuid, patient_id=patient.id)
            db.add(session_row)
            db.flush()

            report_row = Report(
                session_id=session_row.id,
                conversation_json=result["conversation"],
                soap_json=result["soap"],
                pdf_path=str(pdf_path),
            )
            db.add(report_row)
            db.commit()
        except Exception:
            db.rollback()
            raise

    return {
        "conversation": result["conversation"],
        "soap": result["soap"],
        "pdf_path": str(pdf_path),
    }

