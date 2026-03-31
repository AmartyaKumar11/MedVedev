import os
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc

from app.core.dependencies import get_current_doctor
from app.db.models import Patient, Report, SessionModel
from app.db.session import SessionLocal

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("")
def list_patients(doctor=Depends(get_current_doctor)) -> dict:
    with SessionLocal() as db:
        rows = (
            db.query(Patient)
            .filter(Patient.doctor_id == doctor.id)
            .order_by(desc(Patient.created_at))
            .all()
        )
        return {
            "patients": [
                {
                    "id": str(p.id),
                    "name": p.name,
                    "created_at": p.created_at.isoformat(),
                }
                for p in rows
            ]
        }


@router.get("/{patient_id}/sessions")
def patient_sessions(patient_id: str, doctor=Depends(get_current_doctor)) -> dict:
    try:
        pid = UUID(patient_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid patient_id.")

    with SessionLocal() as db:
        patient = db.get(Patient, pid)
        if patient is None or patient.doctor_id != doctor.id:
            raise HTTPException(status_code=404, detail="Patient not found.")

        sessions = (
            db.query(SessionModel)
            .filter(SessionModel.patient_id == pid, SessionModel.doctor_id == doctor.id)
            .order_by(desc(SessionModel.created_at))
            .all()
        )

        out = []
        for s in sessions:
            report = (
                db.query(Report)
                .filter(Report.session_id == s.id)
                .order_by(desc(Report.created_at))
                .first()
            )
            pdf_url = None
            if report and report.pdf_path:
                pdf_filename = Path(report.pdf_path).name
                pdf_url = f"/reports/{pdf_filename}"
            out.append(
                {
                    "session_id": str(s.id),
                    "created_at": s.created_at.isoformat(),
                    "pdf_url": pdf_url,
                }
            )

        return {"sessions": out}

