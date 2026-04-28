import { downloadTranscription } from "../api/transcription";

export default function TranscriptResult({ data }) {
  const text = data.filler_removal_enabled && data.filler_removed
    ? data.filler_removed
    : data.transcript;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>文字起こし結果</h2>
      <p style={{ whiteSpace: "pre-wrap", background: "#f5f5f5", padding: "1rem" }}>
        {text}
      </p>

      <h3>ダウンロード</h3>
      {["txt", "srt", "vtt", "tsv", "json"].map((fmt) => (
        <button
          key={fmt}
          onClick={() => downloadTranscription(data.job_id, fmt)}
          style={{ marginRight: "0.5rem" }}
        >
          {fmt.toUpperCase()}
        </button>
      ))}
    </div>
  );
}