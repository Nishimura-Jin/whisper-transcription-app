import whisper
import torch
import warnings
import re
import os
import soundfile as sf
from concurrent.futures import ThreadPoolExecutor
from pyannote.audio import Pipeline

# Warning抑制
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

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


_whisper_model = None
_diarization_pipeline = None


def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[INFO] Whisper使用デバイス: {device}")
        _whisper_model = whisper.load_model("medium", device=device)
    return _whisper_model


def get_diarization_pipeline():
    global _diarization_pipeline
    if _diarization_pipeline is None:
        token = os.getenv("HUGGINGFACE_TOKEN")
        if token:
            print(f"[INFO] HFトークン確認OK: {token[:10]}...")
        else:
            print("[ERROR] HUGGINGFACE_TOKENが取得できていません")
            raise ValueError("HUGGINGFACE_TOKEN is not set")

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"[INFO] pyannote使用デバイス: {device}")

        _diarization_pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            token=token,
        ).to(device)
    return _diarization_pipeline


def assign_speakers(segments, diarization):
    annotation = diarization.speaker_diarization

    result = []
    for segment in segments:
        seg_start = segment["start"]
        seg_end = segment["end"]
        text = segment["text"].strip()

        speaker = "UNKNOWN"
        max_overlap = 0

        for turn, _, label in annotation.itertracks(yield_label=True):
            overlap = min(turn.end, seg_end) - max(turn.start, seg_start)
            if overlap > max_overlap:
                max_overlap = overlap
                speaker = label

        result.append(
            {
                "start": seg_start,
                "end": seg_end,
                "speaker": speaker,
                "text": text,
            }
        )
    return result


def prepare_audio_for_diarization(file_path: str) -> str:
    import librosa
    import tempfile

    y, sr = librosa.load(file_path, sr=16000, mono=True)
    tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    sf.write(tmp.name, y, 16000)
    return tmp.name


def transcribe_audio(
    file_path: str,
    filler_removal_enabled: bool,
    diarization_enabled: bool = False,  # 追加
) -> dict:
    model = get_whisper_model()
    result = model.transcribe(
        file_path,
        language="ja",
        condition_on_previous_text=False,
    )

    transcript = result["text"]
    segments = result["segments"]

    if filler_removal_enabled:
        transcript = remove_fillers(transcript)
        for seg in segments:
            seg["text"] = remove_fillers(seg["text"])

    # 話者分離ONのときだけ実行
    if diarization_enabled:
        try:
            pipeline = get_diarization_pipeline()
            prepared_path = prepare_audio_for_diarization(file_path)
            diarization = pipeline(prepared_path)
            os.unlink(prepared_path)
            speaker_segments = assign_speakers(segments, diarization)
            print(f"[INFO] 話者分離成功: {len(speaker_segments)}セグメント")
        except Exception as e:
            print(f"[WARNING] 話者分離失敗: {e}")
            speaker_segments = []
    else:
        print("[INFO] 話者分離スキップ（diarization_enabled=False）")
        speaker_segments = []

    return {
        "transcript": transcript,
        "segments": segments,
        "speaker_segments": speaker_segments,
    }
