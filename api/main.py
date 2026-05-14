from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from contextlib import asynccontextmanager

from .config import CORS_ORIGINS, PORT
from .database import init_db
from .routes import transcriptions

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    yield
    # Shutdown

app = FastAPI(lifespan=lifespan, title="D-and-D Transcriber API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transcriptions.router, prefix="/api/transcriptions", tags=["transcriptions"])

if __name__ == "__main__":
    uvicorn.run("api.main:app", host="0.0.0.0", port=PORT, reload=True)
