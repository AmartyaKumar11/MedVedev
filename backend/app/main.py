try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None  # type: ignore[misc, assignment]

if load_dotenv is not None:
    load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import OUTPUT_DIR
from app.db.session import init_db
from app.routers import doctor, patients, session
from app.services.model_registry import load_models

app = FastAPI(
    title="Medvedev API",
    version="1.0",
)

# Browser origin (any http dev URL) differs from API host — CORS required for fetch().
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event() -> None:
    print("Starting Medvedev backend...")
    try:
        init_db()
    except Exception as e:
        raise RuntimeError(f"Database initialization failed: {str(e)}")
    load_models()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print("Database connected and tables initialized.")


app.include_router(session.router)
app.include_router(doctor.router)
app.include_router(patients.router)
app.mount("/reports", StaticFiles(directory=str(OUTPUT_DIR)), name="reports")

