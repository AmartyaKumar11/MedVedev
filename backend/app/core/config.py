import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parents[2] / ".env")
except ImportError:
    pass

BASE_DIR = Path(__file__).resolve().parents[2]
TEMP_AUDIO_DIR = BASE_DIR / "temp_audio"
OUTPUT_DIR = BASE_DIR / "output"
MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024  # 20MB

# Auth (JWT)
SECRET_KEY = os.getenv("SECRET_KEY", "change_this_to_secure_random")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

