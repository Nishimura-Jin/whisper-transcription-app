import whisper
import re
from concurrent.futures import ThreadPoolExecutor
from app.db.database import SessionLocal
from app.models.transcription import Transcription

executor = ThreadPoolExecutor(max_workers=1)

FILLER_WORDS = [
    r"えーと",
    r"えー",
    r"あー",
    r"うー",
    r"まあ",
    r"なんか",
    r"あの",
    r"えっと",
]


def remove_fillers(text: str) -> str:
    for pattern in FILLER_WORDS:
        text = re.sub(pattern, "", text)
    text = re.sub(r"　+", "　", text)
    text = re.sub(r" +", " ", text)
    return text.strip()


_model = None


def get_model():
    global _model
    if _model is None:
        _model = whisper.load_model("tiny")
    return _model


def _do_transcribe(record_id: int, file_path: str, filler_removal_enabled: bool):
    db = SessionLocal()
    try:
        record = db.query(Transcription).filter(Transcription.id == record_id).first()
        record.status = "processing"
        db.commit()

        model = get_model()
        result = model.transcribe(file_path, language="ja")
        transcript = result["text"]

        filler_removed = remove_fillers(transcript) if filler_removal_enabled else None

        record.transcript = transcript
        record.filler_removed = filler_removed
        record.status = "completed"
        db.commit()
        print(f"[SUCCESS] record_id={record_id} completed")

    except Exception as e:
        print(f"[ERROR] transcription failed: {e}")
        try:
            record = (
                db.query(Transcription).filter(Transcription.id == record_id).first()
            )
            record.status = "failed"
            db.commit()
        except:
            pass
    finally:
        db.close()


def transcribe_audio(record_id: int, file_path: str, filler_removal_enabled: bool):
    print(f"[INFO] submitting transcription job for record_id={record_id}")
    executor.submit(_do_transcribe, record_id, file_path, filler_removal_enabled)
