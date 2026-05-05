import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base


try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None  # type: ignore[misc, assignment]

if load_dotenv is not None:
    load_dotenv()


DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set")

try:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
except Exception as e:
    raise RuntimeError("Invalid DATABASE_URL or database not reachable") from e
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)


def init_db() -> None:
    import app.db.models  # noqa: F401

    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        raise RuntimeError(f"Database initialization failed: {str(e)}") from e

