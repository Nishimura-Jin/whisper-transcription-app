import os
import uuid
from urllib.parse import quote
from fastapi import APIRouter, File, Form, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import Response
from app.services.whisper_service import transcribe_audio
from app.services.download_service import to_txt, to_tsv, to_srt, to_vtt, to_json

router = APIRouter()

UPLOAD_DIR = "/tmp/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".mp3", ".mp4", ".wav", ".m4a", ".flac", ".ogg", ".webm"}

FORMAT_MAP = {
    "txt": ("text/plain", to_txt),
    "tsv": ("text/tab-separated-values", to_tsv),
    "srt": ("text/srt", to_srt),
    "vtt": ("text/vtt", to_vtt),
    "json": ("application/json", None),
}

transcription_store = {}
transcription_status = {}


def _do_transcribe(
    job_id: str,
    file_path: str,
    filler_removal_enabled: bool,
    diarization_enabled: bool,
):
    try:
        transcription_status[job_id] = "processing"
        result = transcribe_audio(
            file_path,
            filler_removal_enabled,
            diarization_enabled,
        )
        transcription_store[job_id].update(result)
        transcription_status[job_id] = "completed"
        print(f"[SUCCESS] job_id={job_id} completed")
    except Exception as e:
        print(f"[ERROR] transcription failed: {e}")
        transcription_status[job_id] = "failed"
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)


@router.post("/transcriptions")
async def upload_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    filler_removal_enabled: bool = Form(False),
    diarization_enabled: bool = Form(False),
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"非対応の形式です: {ext}")

    original_stem = os.path.splitext(file.filename)[0]
    job_id = str(uuid.uuid4())
    save_path = os.path.join(UPLOAD_DIR, f"{job_id}{ext}")

    with open(save_path, "wb") as f:
        content = await file.read()
        f.write(content)

    transcription_status[job_id] = "pending"
    transcription_store[job_id] = {"original_stem": original_stem}
    background_tasks.add_task(
        _do_transcribe,
        job_id=job_id,
        file_path=save_path,
        filler_removal_enabled=filler_removal_enabled,
        diarization_enabled=diarization_enabled,
    )

    return {"job_id": job_id, "status": "pending", "filename": file.filename}


@router.get("/transcriptions/{job_id}")
def get_transcription(job_id: str):
    status = transcription_status.get(job_id)
    if status is None:
        raise HTTPException(status_code=404, detail="ジョブが見つかりません")

    result = transcription_store.get(job_id)
    return {
        "job_id": job_id,
        "status": status,
        "transcript": result.get("transcript") if result else None,
        "segments": result.get("segments") if result else None,
        "speaker_segments": result.get("speaker_segments") if result else None,
    }


@router.get("/transcriptions/{job_id}/download")
def download_transcription(job_id: str, format: str = "txt"):
    if format not in FORMAT_MAP:
        raise HTTPException(
            status_code=400, detail=f"非対応のフォーマットです: {format}"
        )

    status = transcription_status.get(job_id)
    if status is None:
        raise HTTPException(status_code=404, detail="ジョブが見つかりません")
    if status != "completed":
        raise HTTPException(
            status_code=400, detail="文字起こし完了後にダウンロードできます"
        )

    result = transcription_store.get(job_id)
    text = result["transcript"]
    media_type, converter = FORMAT_MAP[format]

    if format == "json":
        content = to_json(text, job_id)
    else:
        content = converter(text)

    original_stem = result.get("original_stem", f"transcription_{job_id[:8]}")
    filename = f"{original_stem}.{format}"
    encoded_filename = quote(filename)
    return Response(
        content=content,
        media_type=media_type,
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
        },
    )
