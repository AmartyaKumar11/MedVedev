from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.core.config import OUTPUT_DIR
from app.db.session import init_db
from app.routers import doctor, session
from app.services.model_registry import load_models

app = FastAPI(
    title="Medvedev API",
    version="1.0",
)


@app.on_event("startup")
def startup_event() -> None:
    init_db()
    load_models()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


app.include_router(session.router)
app.include_router(doctor.router)
app.mount("/reports", StaticFiles(directory=str(OUTPUT_DIR)), name="reports")

