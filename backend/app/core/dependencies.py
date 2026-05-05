from typing import Optional
from uuid import UUID

from fastapi import Header, HTTPException
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES
from app.db.models import Doctor
from app.db.session import SessionLocal
from app.services.auth_service import decode_access_token


def get_current_doctor(authorization: Optional[str] = Header(default=None)) -> Doctor:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Invalid or missing token.")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid or missing token.")

    try:
        payload = decode_access_token(token)
        doctor_id_raw = payload.get("doctor_id")
        if not doctor_id_raw:
            raise HTTPException(status_code=401, detail="Invalid token.")
        doctor_uuid = UUID(str(doctor_id_raw))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired token.") from e

    try:
        with SessionLocal() as db:
            doctor = db.get(Doctor, doctor_uuid)
            if doctor is None:
                raise HTTPException(status_code=401, detail="Invalid token.")
            return doctor
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail="Database error.") from e

