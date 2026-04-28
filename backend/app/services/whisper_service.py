import whisper
import torch
import re
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=1)

FILLER_WORDS = [
    r"えーと、?",
    r"えー、?",
    r"あのー、?",
    r"あの、?",
    r"えっと、?",
    r"まー、?",
    r"そのー、?",
    r"まあ、?",
    r"なんか、?",
]


def remove_fillers(text: str) -> str:
    for pattern in FILLER_WORDS:
        text = re.sub(pattern, "", text)
    text = re.sub(r"　+", "　", text)
    text = re.sub(r" +", " ", text)
    return text.strip()


def remove_fillers_from_segments(segments):
    for segment in segments:
        segment["text"] = remove_fillers(segment["text"])
    return segments


_model = None


def get_model():
    global _model
    if _model is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[INFO] 使用デバイス: {device}")
        _model = whisper.load_model("tiny", device=device)
    return _model


def transcribe_audio(file_path: str, filler_removal_enabled: bool) -> dict:
    model = get_model()
    result = model.transcribe(
        file_path,
        language="ja",
        condition_on_previous_text=False,
    )

    transcript = result["text"]
    segments = result["segments"]

    if filler_removal_enabled:
        transcript = remove_fillers(transcript)
        segments = remove_fillers_from_segments(segments)

    return {
        "transcript": transcript,
        "segments": segments,
    }
