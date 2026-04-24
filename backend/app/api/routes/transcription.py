import os
from fastapi.responses import Response
from app.services.download_service import to_txt, to_tsv, to_srt, to_vtt, to_json

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


@router.get("/transcriptions", response_model=list[TranscriptionResponse])
def get_transcriptions(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    records = (
        db.query(Transcription)
        .order_by(Transcription.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return records


from app.services.whisper_service import remove_fillers


@router.patch(
    "/transcriptions/{transcription_id}/filler", response_model=TranscriptionResponse
)
def toggle_filler(transcription_id: int, enabled: bool, db: Session = Depends(get_db)):
    record = (
        db.query(Transcription).filter(Transcription.id == transcription_id).first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="レコードが見つかりません")
    if record.status != "completed":
        raise HTTPException(
            status_code=400, detail="文字起こし完了後に操作してください"
        )

    record.filler_removal_enabled = enabled
    if enabled:
        record.filler_removed = remove_fillers(record.transcript)
    else:
        record.filler_removed = None

    db.commit()
    db.refresh(record)
    return record


FORMAT_MAP = {
    "txt": ("text/plain", to_txt),
    "tsv": ("text/tab-separated-values", to_tsv),
    "srt": ("text/srt", to_srt),
    "vtt": ("text/vtt", to_vtt),
    "json": ("application/json", None),
}


@router.get("/transcriptions/{transcription_id}/download")
def download_transcription(
    transcription_id: int,
    format: str = "txt",
    use_filler_removed: bool = False,
    db: Session = Depends(get_db),
):
    if format not in FORMAT_MAP:
        raise HTTPException(
            status_code=400, detail=f"非対応のフォーマットです: {format}"
        )

    record = (
        db.query(Transcription).filter(Transcription.id == transcription_id).first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="レコードが見つかりません")
    if record.status != "completed":
        raise HTTPException(
            status_code=400, detail="文字起こし完了後にダウンロードできます"
        )

    text = (
        record.filler_removed
        if (use_filler_removed and record.filler_removed)
        else record.transcript
    )
    media_type, converter = FORMAT_MAP[format]

    if format == "json":
        content = to_json(text, record.filename)
    else:
        content = converter(text)

    from urllib.parse import quote

    filename = f"{record.filename}.{format}"
    encoded_filename = quote(filename)
    return Response(
        content=content,
        media_type=media_type,
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
        },
    )
