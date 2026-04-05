from typing import Dict
from uuid import uuid4
from uuid import UUID

import torch
import torch.nn.functional as F
from app.core.config import OUTPUT_DIR
from app.db.models import Doctor, DoctorEmbedding, Patient, Report, SessionModel
from app.db.session import SessionLocal
from live_chunk_with_speaker import process_audio
from app.services.model_registry import load_models, registry
from services.pdf_service import generate_pdf


def run_pipeline(audio_path: str, doctor_id: str, patient_name: str) -> Dict:
    """
    Orchestrates full pipeline execution.
    """
    patient_name_clean = patient_name.strip()
    if not patient_name_clean:
        raise ValueError("patient_name is required.")

    try:
        doctor_uuid = UUID(doctor_id)
    except ValueError as e:
        raise ValueError("doctor_id must be a valid UUID.") from e

    load_models()
    if registry.device is None:
        raise RuntimeError("Model device is not initialized.")

    with SessionLocal() as db:
        doctor = db.get(Doctor, doctor_uuid)
        if doctor is None:
            raise ValueError("Doctor not found.")

        embedding_rows = (
            db.query(DoctorEmbedding)
            .filter(DoctorEmbedding.doctor_id == doctor_uuid)
            .all()
        )
        if not embedding_rows:
            raise ValueError("No enrollment embeddings found for doctor.")

        tensor_list = [
            torch.tensor(row.embedding, dtype=torch.float32, device=registry.device)
            for row in embedding_rows
        ]
        doctor_anchor = torch.stack(tensor_list, dim=0).mean(dim=0)
        doctor_anchor = F.normalize(doctor_anchor, p=2, dim=-1)

    result = process_audio(audio_path, doctor_embedding=doctor_anchor)

    with SessionLocal() as db:
        try:
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

            pdf_bytes = generate_pdf(
                {
                    "conversation": result["conversation"],
                    "soap": result["soap"],
                    "patient_name": patient.name,
                    "patient_age": getattr(patient, "age", None),
                    "patient_gender": getattr(patient, "gender", None),
                    "patient_id": str(patient.id),
                    "mpid": str(patient.id),
                    "consultation_date": session_row.created_at.strftime("%d-%m-%Y, %I:%M %p")
                    if session_row.created_at is not None
                    else None,
                    # Doctor info from the authenticated session
                    "doctor_name": doctor.name,
                    "doctor_quals": getattr(doctor, "qualifications", ""),
                }
            )
            OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
            pdf_filename = f"{uuid4().hex}.pdf"
            pdf_path = OUTPUT_DIR / pdf_filename
            with open(pdf_path, "wb") as f:
                f.write(pdf_bytes)

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

