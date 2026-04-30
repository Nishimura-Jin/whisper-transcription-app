import { useState, useRef } from "react";
import { uploadAudio, getTranscription } from "../api/transcription";

function Toggle({ checked, onChange }) {
  return (
    <span
      onClick={() => onChange(!checked)}
      style={{
        ...styles.track,
        background: checked
          ? "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)"
          : "#D1D5DB",
      }}
    >
      <span
        style={{
          ...styles.thumb,
          transform: checked ? "translateX(18px)" : "translateX(2px)",
        }}
      />
    </span>
  );
}

export default function UploadForm({ onComplete }) {
  const [file, setFile] = useState(null);
  const [fillerEnabled, setFillerEnabled] = useState(false);
  const [diarizationEnabled, setDiarizationEnabled] = useState(false);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => { if (f) setFile(f); };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return alert("ファイルを選択してください");
    if (loading) return;
    setLoading(true);
    setStatus("uploading");

    const data = await uploadAudio(file, fillerEnabled, diarizationEnabled);
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
    <div style={styles.wrapper}>

      {/* タイトル */}
      <div style={styles.titleArea}>
        <h2 style={styles.title}>音声ファイルをアップロード</h2>
        <p style={styles.subtitle}>mp3・mp4・wav・m4a・flac・ogg・webm に対応</p>
      </div>

      {/* ドロップゾーン */}
      <div
        style={{
          ...styles.dropzone,
          borderColor: dragging ? "#2563EB" : file ? "#7C3AED" : "#D1D5DB",
          background: dragging ? "#EFF6FF" : file ? "#FAF5FF" : "#FAFAFA",
        }}
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.mp4,.wav,.m4a,.flac,.ogg,.webm"
          onChange={(e) => handleFile(e.target.files[0])}
          style={{ display: "none" }}
        />
        <div style={styles.dropIcon}>
          {file ? (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          )}
        </div>
        {file ? (
          <>
            <p style={{ ...styles.dropMain, color: "#7C3AED", fontWeight: "600" }}>{file.name}</p>
            <p style={styles.dropSub}>クリックして変更</p>
          </>
        ) : (
          <>
            <p style={styles.dropMain}>クリックまたはドラッグ&ドロップ</p>
            <p style={styles.dropSub}>mp3 / mp4 / wav / m4a / flac / ogg / webm</p>
          </>
        )}
      </div>

      {/* オプション */}
      <div style={styles.optionGroup}>
        <p style={styles.optionGroupLabel}>オプション</p>

        <div style={styles.optionRow}>
          <span style={styles.optionText}>
            <span style={styles.optionTitle}>フィラー除去</span>
            <span style={styles.optionDesc}>「えーと」「あのー」などを自動削除</span>
          </span>
          <Toggle checked={fillerEnabled} onChange={setFillerEnabled} />
        </div>

        <div style={styles.divider} />

        <div style={styles.optionRow}>
          <span style={styles.optionText}>
            <span style={styles.optionTitle}>話者分離</span>
            <span style={styles.optionDesc}>複数の話者を自動識別して色分け表示（処理時間が増加します）</span>
          </span>
          <Toggle checked={diarizationEnabled} onChange={setDiarizationEnabled} />
        </div>
      </div>

      {/* ボタン */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={loading ? styles.btnDisabled : styles.btn}
      >
        {loading ? (
          <span style={styles.btnInner}>
            <span style={styles.spinner} />
            処理中...
          </span>
        ) : "アップロード"}
      </button>

      {/* ステータス */}
      {status && (
        <div style={styles.statusRow}>
          <span style={{ ...styles.statusDot, background: dotColor(status) }} />
          <span style={{ fontSize: "0.85rem", fontWeight: "600", color: textColor(status) }}>
            {statusLabel(status)}
          </span>
        </div>
      )}
    </div>
  );
}

const statusLabel = (s) =>
  ({ uploading: "アップロード中...", processing: "文字起こし中...", completed: "完了", failed: "失敗" }[s] || s);
const dotColor = (s) =>
  ({ uploading: "#2563EB", processing: "#D97706", completed: "#16A34A", failed: "#DC2626" }[s] || "#9CA3AF");
const textColor = (s) =>
  ({ uploading: "#1D4ED8", processing: "#B45309", completed: "#15803D", failed: "#B91C1C" }[s] || "#6B7280");

const styles = {
  wrapper: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
    padding: "2rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  titleArea: {
    borderBottom: "1px solid #F3F4F6",
    paddingBottom: "1rem",
  },
  title: {
    margin: "0 0 4px",
    fontSize: "1.05rem",
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    margin: 0,
    fontSize: "0.78rem",
    color: "#9CA3AF",
  },
  dropzone: {
    border: "2px dashed",
    borderRadius: "10px",
    padding: "2.5rem 1.5rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    transition: "all 0.15s",
    userSelect: "none",
  },
  dropIcon: {
    marginBottom: "4px",
  },
  dropMain: {
    margin: 0,
    fontSize: "0.9rem",
    color: "#374151",
    fontWeight: "500",
    textAlign: "center",
  },
  dropSub: {
    margin: 0,
    fontSize: "0.75rem",
    color: "#9CA3AF",
    textAlign: "center",
  },
  optionGroup: {
    border: "1px solid #E5E7EB",
    borderRadius: "10px",
    padding: "1rem 1.25rem",
    background: "#FAFAFA",
  },
  optionGroupLabel: {
    margin: "0 0 0.85rem",
    fontSize: "0.7rem",
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  optionRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1.5rem",
  },
  optionText: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
  },
  optionTitle: {
    fontSize: "0.88rem",
    fontWeight: "600",
    color: "#111827",
  },
  optionDesc: {
    fontSize: "0.75rem",
    color: "#6B7280",
    lineHeight: "1.45",
  },
  divider: {
    height: "1px",
    background: "#F3F4F6",
    margin: "0.85rem 0",
  },
  track: {
    display: "inline-block",
    width: "42px",
    height: "24px",
    borderRadius: "999px",
    cursor: "pointer",
    position: "relative",
    flexShrink: 0,
    transition: "background 0.2s",
  },
  thumb: {
    position: "absolute",
    top: "3px",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "#fff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
    transition: "transform 0.2s",
  },
  btn: {
    width: "100%",
    padding: "12px",
    background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "700",
    fontSize: "0.95rem",
    cursor: "pointer",
    letterSpacing: "0.02em",
  },
  btnDisabled: {
    width: "100%",
    padding: "12px",
    background: "#E5E7EB",
    color: "#9CA3AF",
    border: "none",
    borderRadius: "8px",
    fontWeight: "700",
    fontSize: "0.95rem",
    cursor: "not-allowed",
  },
  btnInner: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  },
  spinner: {
    display: "inline-block",
    width: "14px",
    height: "14px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
  },
};