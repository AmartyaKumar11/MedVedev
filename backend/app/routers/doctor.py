import os
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from passlib.hash import bcrypt as passlib_bcrypt
from passlib.hash import pbkdf2_sha256
from pydub import AudioSegment

from app.core.config import MAX_UPLOAD_SIZE_BYTES, TEMP_AUDIO_DIR
from app.db.models import Doctor, DoctorEmbedding
from app.db.session import SessionLocal
from app.services.model_registry import load_models, registry
from app.services.auth_service import create_access_token, verify_password
from live_chunk_with_speaker import get_embedding

router = APIRouter(prefix="/doctor", tags=["doctor"])


def _hash_password(password: str) -> str:
    try:
        return passlib_bcrypt.hash(password)
    except Exception:
        return pbkdf2_sha256.hash(password)


def _validate_audio_upload(file: UploadFile) -> None:
    content_type = (file.content_type or "").lower()
    if not content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Only audio uploads are allowed.")


def _save_upload_safely(upload: UploadFile) -> Path:
    TEMP_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    suffix = Path(upload.filename or "").suffix or ".bin"
    safe_name = f"{uuid4().hex}{suffix}"
    target_path = TEMP_AUDIO_DIR / safe_name

    total_bytes = 0
    with open(target_path, "wb") as f:
        while True:
            chunk = upload.file.read(1024 * 1024)
            if not chunk:
                break
            total_bytes += len(chunk)
            if total_bytes > MAX_UPLOAD_SIZE_BYTES:
                f.close()
                if target_path.exists():
                    target_path.unlink()
                raise HTTPException(status_code=413, detail="Audio file exceeds 20MB limit.")
            f.write(chunk)
    return target_path


@router.post("/enroll")
def enroll_doctor(
    name: str = Form(...),
    password: str = Form(...),
    audio1: UploadFile = File(...),
    audio2: UploadFile = File(...),
    audio3: UploadFile = File(...),
) -> dict:
    name_clean = name.strip()
    password_clean = password.strip()
    if not name_clean:
        raise HTTPException(status_code=400, detail="name is required.")
    if not password_clean:
        raise HTTPException(status_code=400, detail="password is required.")

    uploads = [audio1, audio2, audio3]
    if len(uploads) != 3:
        raise HTTPException(status_code=400, detail="Exactly 3 audio files are required.")

    for upload in uploads:
        _validate_audio_upload(upload)

    load_models()
    if registry.spk_model is None or registry.device is None:
        raise HTTPException(status_code=500, detail="Speaker model not initialized.")

    temp_paths: list[Path] = []
    try:
        embedding_vectors: list[list[float]] = []
        for upload in uploads:
            temp_path = _save_upload_safely(upload)
            temp_paths.append(temp_path)
            segment = AudioSegment.from_file(temp_path)
            emb = get_embedding(registry.spk_model, segment, registry.device)
            embedding_vectors.append(emb.detach().cpu().tolist())

        password_hash = _hash_password(password_clean)

        with SessionLocal() as db:
            doctor = Doctor(name=name_clean, password_hash=password_hash)
            db.add(doctor)
            db.flush()

            for emb in embedding_vectors:
                db.add(DoctorEmbedding(doctor_id=doctor.id, embedding=emb))

            db.commit()
            doctor_id = str(doctor.id)

        return {
            "doctor_id": doctor_id,
            "message": "Enrollment successful",
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Doctor enrollment failed: {e}")
        raise HTTPException(status_code=500, detail="Doctor enrollment failed.")
    finally:
        for path in temp_paths:
            try:
                if path.exists():
                    os.remove(path)
            except Exception as e:
                print(f"Failed to clean up enrollment temp file: {e}")
        for upload in uploads:
            try:
                upload.file.close()
            except Exception:
                pass


@router.post("/login")
def doctor_login(
    name: str = Form(...),
    password: str = Form(...),
) -> dict:
    name_clean = name.strip()
    password_clean = password.strip()
    if not name_clean or not password_clean:
        raise HTTPException(status_code=400, detail="name and password are required.")

    with SessionLocal() as db:
        doctor = db.query(Doctor).filter(Doctor.name == name_clean).first()
        if doctor is None:
            raise HTTPException(status_code=401, detail="Invalid credentials.")

        if not verify_password(password_clean, doctor.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials.")

        token = create_access_token({"doctor_id": str(doctor.id)})
        return {"access_token": token, "token_type": "bearer"}

