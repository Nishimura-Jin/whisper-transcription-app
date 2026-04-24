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


def to_srt(transcript: str) -> str:
    lines = transcript.strip().split("。")
    blocks = []
    for i, line in enumerate(lines):
        if line.strip():
            start = f"00:00:{i*5:02d},000"
            end = f"00:00:{(i+1)*5:02d},000"
            blocks.append(f"{i+1}\n{start} --> {end}\n{line.strip()}\n")
    return "\n".join(blocks)


def to_vtt(transcript: str) -> str:
    lines = transcript.strip().split("。")
    blocks = ["WEBVTT\n"]
    for i, line in enumerate(lines):
        if line.strip():
            start = f"00:00:{i*5:02d}.000"
            end = f"00:00:{(i+1)*5:02d}.000"
            blocks.append(f"{start} --> {end}\n{line.strip()}\n")
    return "\n".join(blocks)


def to_json(transcript: str, filename: str) -> str:
    return json.dumps(
        {"filename": filename, "transcript": transcript}, ensure_ascii=False, indent=2
    )
