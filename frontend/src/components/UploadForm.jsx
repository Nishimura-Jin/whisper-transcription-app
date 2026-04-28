import { useState } from "react";
import { uploadAudio, getTranscription } from "../api/transcription";

export default function UploadForm({ onComplete }) {
  const [file, setFile] = useState(null);
  const [fillerEnabled, setFillerEnabled] = useState(false);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!file) return alert("ファイルを選択してください");
    if (loading) return; // 二重送信防止
    setLoading(true);
    setStatus("uploading");

    const data = await uploadAudio(file, fillerEnabled);
    setStatus("processing");

    const interval = setInterval(async () => {
        const result = await getTranscription(data.job_id);
        if (result.status === "completed" || result.status === "failed") {
            clearInterval(interval);
            setStatus(result.status);
            setLoading(false);
            onComplete(result);
        }
    }, 2000);
};

  return (
    <div style={{ padding: "2rem" }}>
      <h2>音声ファイルをアップロード</h2>

      <input
        type="file"
        accept=".mp3,.mp4,.wav,.m4a,.flac,.ogg,.webm"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <div style={{ margin: "1rem 0" }}>
        <label>
          <input
            type="checkbox"
            checked={fillerEnabled}
            onChange={(e) => setFillerEnabled(e.target.checked)}
          />
          　フィラー除去を有効にする
        </label>
      </div>

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "処理中..." : "アップロード"}
      </button>

      {status && <p>ステータス：{status}</p>}
    </div>
  );
}