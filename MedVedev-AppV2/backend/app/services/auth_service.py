from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from jose import JWTError, jwt
from passlib.hash import bcrypt as passlib_bcrypt
from passlib.hash import pbkdf2_sha256

from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES, ALGORITHM, SECRET_KEY


def hash_password(password: str) -> str:
    try:
        return passlib_bcrypt.hash(password)
    except Exception:
        return pbkdf2_sha256.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bool(passlib_bcrypt.verify(password, password_hash))
    except Exception:
        # fallback for hashes created with pbkdf2_sha256
        try:
            return bool(pbkdf2_sha256.verify(password, password_hash))
        except Exception:
            return False


def create_access_token(data: Dict[str, Any]) -> str:
    to_encode = dict(data)
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if not isinstance(payload, dict):
            raise JWTError("Invalid token payload")
        return payload
    except JWTError as e:
        raise ValueError("Invalid or expired token") from e

