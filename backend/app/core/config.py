from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
TEMP_AUDIO_DIR = BASE_DIR / "temp_audio"
OUTPUT_DIR = BASE_DIR / "output"
MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024  # 20MB

