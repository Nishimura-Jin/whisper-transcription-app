from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.transcription import router as transcription_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transcription_router, prefix="/api", tags=["transcriptions"])


@app.get("/")
def read_root():
    return {"message": "Whisper Transcription API"}
