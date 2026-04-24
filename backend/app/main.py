import app.models.transcription
from app.db.database import Base, engine
from fastapi import FastAPI
from app.api.routes.transcription import router as transcription_router

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(transcription_router, prefix="/api", tags=["transcriptions"])


@app.get("/")
def read_root():
    return {"message": "Hello World"}
