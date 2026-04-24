import os
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    UploadFile,
    HTTPException,
    BackgroundTasks,
)
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.transcription import Transcription
from app.schemas.transcription import TranscriptionResponse
from app.services.whisper_service import transcribe_audio

router = APIRouter()

UPLOAD_DIR = "/tmp/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".mp3", ".mp4", ".wav", ".m4a", ".flac", ".ogg", ".webm"}


@router.post("/transcriptions", response_model=TranscriptionResponse)
async def upload_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    filler_removal_enabled: bool = Form(False),
    db: Session = Depends(get_db),
):
    # 拡張子チェック
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"非対応の形式です: {ext}")

    # DBレコード作成（pending状態）
    record = Transcription(
        filename=file.filename,
        filler_removal_enabled=filler_removal_enabled,
        status="pending",
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # ファイル保存
    save_path = os.path.join(UPLOAD_DIR, f"{record.id}{ext}")
    with open(save_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # バックグラウンドで文字起こし実行
    background_tasks.add_task(
        transcribe_audio,
        record_id=record.id,
        file_path=save_path,
        filler_removal_enabled=filler_removal_enabled,
    )

    return record


@router.get("/transcriptions/{transcription_id}", response_model=TranscriptionResponse)
def get_transcription(transcription_id: int, db: Session = Depends(get_db)):
    record = (
        db.query(Transcription).filter(Transcription.id == transcription_id).first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="レコードが見つかりません")
    return record
