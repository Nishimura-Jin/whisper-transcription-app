import json


def to_txt(transcript: str) -> str:
    return transcript


def to_tsv(transcript: str) -> str:
    lines = transcript.strip().split("。")
    rows = ["start\tend\ttext"]
    for i, line in enumerate(lines):
        if line.strip():
            rows.append(f"{i*5:.3f}\t{(i+1)*5:.3f}\t{line.strip()}")
    return "\n".join(rows)


def _iter_segments(transcript: str):
    for i, line in enumerate(transcript.strip().split("。")):
        if line.strip():
            yield i, i * 5, (i + 1) * 5, line.strip()


def to_srt(transcript: str) -> str:
    blocks = []
    for i, start, end, text in _iter_segments(transcript):
        blocks.append(f"{i+1}\n00:00:{start:02d},000 --> 00:00:{end:02d},000\n{text}\n")
    return "\n".join(blocks)


def to_vtt(transcript: str) -> str:
    blocks = ["WEBVTT\n"]
    for _, start, end, text in _iter_segments(transcript):
        blocks.append(f"00:00:{start:02d}.000 --> 00:00:{end:02d}.000\n{text}\n")
    return "\n".join(blocks)


def to_json(transcript: str, filename: str) -> str:
    return json.dumps(
        {"filename": filename, "transcript": transcript}, ensure_ascii=False, indent=2
    )
