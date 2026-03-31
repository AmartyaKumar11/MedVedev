import os
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.core.config import MAX_UPLOAD_SIZE_BYTES, TEMP_AUDIO_DIR
from app.services.pipeline_service import run_pipeline

router = APIRouter(prefix="/session", tags=["session"])


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


@router.post("/process")
def process_session_audio(
    file: UploadFile = File(...),
    doctor_id: str = Form(...),
    patient_name: str = Form(...),
) -> dict:
    if not doctor_id.strip():
        raise HTTPException(status_code=400, detail="doctor_id is required.")
    if not patient_name.strip():
        raise HTTPException(status_code=400, detail="patient_name is required.")
    if len(patient_name.strip()) > 255:
        raise HTTPException(status_code=400, detail="patient_name is too long.")

    _validate_audio_upload(file)

    saved_path: Path | None = None
    try:
        saved_path = _save_upload_safely(file)
        result = run_pipeline(
            str(saved_path),
            doctor_id=doctor_id.strip(),
            patient_name=patient_name.strip(),
        )
        pdf_filename = Path(result["pdf_path"]).name
        pdf_url = f"/reports/{pdf_filename}"
        return {
            "conversation": result["conversation"],
            "soap": result["soap"],
            "pdf_url": pdf_url,
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Pipeline processing failed: {e}")
        raise HTTPException(status_code=500, detail="Pipeline processing failed.")
    finally:
        try:
            if saved_path and saved_path.exists():
                os.remove(saved_path)
        except Exception as e:
            print(f"Failed to clean up temporary audio: {e}")
        try:
            file.file.close()
        except Exception:
            pass

