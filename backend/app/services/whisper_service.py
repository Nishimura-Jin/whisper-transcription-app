import whisper
import re
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.transcription import Transcription

# フィラーワードのリスト
FILLER_WORDS = [
    r"\bえー+と\b",
    r"\bえー+\b",
    r"\bあー+\b",
    r"\bうー+\b",
    r"\bまあ\b",
    r"\bなんか\b",
    r"\bその\b",
    r"\bあの\b",
    r"\bえっと\b",
]


def remove_fillers(text: str) -> str:
    for pattern in FILLER_WORDS:
        text = re.sub(pattern, "", text)
    # 余分なスペース・句読点の重複を整理
    text = re.sub(r"　+", "　", text)
    text = re.sub(r" +", " ", text)
    return text.strip()


def transcribe_audio(record_id: int, file_path: str, filler_removal_enabled: bool):
    db: Session = SessionLocal()
    try:
        # statusをprocessingに更新
        record = db.query(Transcription).filter(Transcription.id == record_id).first()
        record.status = "processing"
        db.commit()

        # Whisperで文字起こし
        model = whisper.load_model("base")
        result = model.transcribe(file_path, language="ja")
        transcript = result["text"]

        # フィラー除去
        filler_removed = remove_fillers(transcript) if filler_removal_enabled else None

        # DB更新
        record.transcript = transcript
        record.filler_removed = filler_removed
        record.status = "completed"
        db.commit()

    except Exception as e:
        record = db.query(Transcription).filter(Transcription.id == record_id).first()
        record.status = "failed"
        db.commit()
        print(f"[ERROR] transcription failed: {e}")

    finally:
        db.close()
