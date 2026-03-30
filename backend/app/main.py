from fastapi import FastAPI

from app.routers import session

app = FastAPI(
    title="Medvedev API",
    version="1.0",
)

app.include_router(session.router)

