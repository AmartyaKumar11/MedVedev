from pathlib import Path
from typing import Dict

from live_chunk_with_speaker import process_audio


def run_pipeline(audio_path: str, doctor_id: str) -> Dict:
    """
    Orchestrates full pipeline execution.
    """
    _ = doctor_id
    doctor_enroll_path = str((Path(__file__).resolve().parents[3] / "doctor-amartya.mp3"))
    result = process_audio(audio_path, doctor_enroll_path)
    return result

