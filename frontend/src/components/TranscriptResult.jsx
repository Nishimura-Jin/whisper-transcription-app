import { useState } from "react";
import { downloadTranscription } from "../api/transcription";

// 話者ごとのカラーパレット（背景・テキスト・ボーダー）
const SPEAKER_PALETTE = [
  { bg: "#EFF6FF", border: "#3B82F6", label: "#1D4ED8", dot: "#3B82F6" },
  { bg: "#F0FDF4", border: "#22C55E", label: "#15803D", dot: "#22C55E" },
  { bg: "#FFF7ED", border: "#F97316", label: "#C2410C", dot: "#F97316" },
  { bg: "#FDF4FF", border: "#A855F7", label: "#7E22CE", dot: "#A855F7" },
  { bg: "#FFF1F2", border: "#F43F5E", label: "#BE123C", dot: "#F43F5E" },
];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 10);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${ms}`;
}

export default function TranscriptResult({ data }) {
  const [activeTab, setActiveTab] = useState("speakers");
  const speakerSegments = data.speaker_segments || [];

  // 話者 → パレット index のマッピング
  const speakerMap = {};
  let speakerCount = 0;
  speakerSegments.forEach((seg) => {
    if (!(seg.speaker in speakerMap)) {
      speakerMap[seg.speaker] = speakerCount % SPEAKER_PALETTE.length;
      speakerCount++;
    }
  });

  const uniqueSpeakers = Object.keys(speakerMap);

  return (
    <div style={styles.wrapper}>
      {/* ヘッダー */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>🎙️</span>
          <h2 style={styles.headerTitle}>文字起こし結果</h2>
        </div>
        {speakerSegments.length > 0 && (
          <div style={styles.speakerBadges}>
            {uniqueSpeakers.map((sp) => {
              const p = SPEAKER_PALETTE[speakerMap[sp]];
              return (
                <span
                  key={sp}
                  style={{
                    ...styles.speakerBadge,
                    background: p.bg,
                    border: `1px solid ${p.border}`,
                    color: p.label,
                  }}
                >
                  <span
                    style={{ ...styles.dot, background: p.dot }}
                  />
                  {sp}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* タブ */}
      {speakerSegments.length > 0 && (
        <div style={styles.tabBar}>
          <button
            style={activeTab === "speakers" ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab("speakers")}
          >
            話者別
          </button>
          <button
            style={activeTab === "full" ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab("full")}
          >
            全文
          </button>
        </div>
      )}

      {/* 話者別ビュー */}
      {(activeTab === "speakers" && speakerSegments.length > 0) ? (
        <div style={styles.segmentList}>
          {speakerSegments.map((seg, i) => {
            const p = SPEAKER_PALETTE[speakerMap[seg.speaker]];
            return (
              <div
                key={i}
                style={{
                  ...styles.segment,
                  borderLeft: `4px solid ${p.border}`,
                  background: p.bg,
                }}
              >
                <div style={styles.segmentMeta}>
                  <span style={{ ...styles.speakerLabel, color: p.label }}>
                    <span style={{ ...styles.dot, background: p.dot }} />
                    {seg.speaker}
                  </span>
                  <span style={styles.timestamp}>
                    {formatTime(seg.start)} → {formatTime(seg.end)}
                  </span>
                </div>
                <p style={styles.segmentText}>{seg.text}</p>
              </div>
            );
          })}
        </div>
      ) : (
        /* 全文ビュー（タブなし or 全文タブ選択時） */
        <div style={styles.fullText}>
          <pre style={styles.fullTextPre}>{data.transcript}</pre>
        </div>
      )}

      {/* 話者分離なしの場合は全文を直接表示 */}
      {speakerSegments.length === 0 && (
        <div style={styles.fullText}>
          <pre style={styles.fullTextPre}>{data.transcript}</pre>
        </div>
      )}

      {/* ダウンロード */}
      <div style={styles.downloadSection}>
        <p style={styles.downloadLabel}>ダウンロード</p>
        <div style={styles.downloadButtons}>
          {["txt", "srt", "vtt", "tsv", "json"].map((fmt) => (
            <button
              key={fmt}
              onClick={() => downloadTranscription(data.job_id, fmt)}
              style={styles.dlBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#1D4ED8";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.color = "#374151";
              }}
            >
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    fontFamily: "'Noto Sans JP', 'Hiragino Sans', sans-serif",
    maxWidth: "860px",
    margin: "0 auto",
    padding: "2rem",
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "0.75rem",
    marginBottom: "1.5rem",
    paddingBottom: "1rem",
    borderBottom: "2px solid #F3F4F6",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  headerIcon: {
    fontSize: "1.4rem",
  },
  headerTitle: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#111827",
  },
  speakerBadges: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  speakerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "3px 10px",
    borderRadius: "999px",
    fontSize: "0.78rem",
    fontWeight: "600",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    display: "inline-block",
    flexShrink: 0,
  },
  tabBar: {
    display: "flex",
    gap: "0.25rem",
    marginBottom: "1.25rem",
    background: "#F3F4F6",
    borderRadius: "8px",
    padding: "4px",
    width: "fit-content",
  },
  tab: {
    padding: "6px 20px",
    border: "none",
    background: "transparent",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    color: "#6B7280",
    fontWeight: "500",
    transition: "all 0.15s",
  },
  tabActive: {
    padding: "6px 20px",
    border: "none",
    background: "#fff",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem",
    color: "#111827",
    fontWeight: "700",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
    transition: "all 0.15s",
  },
  segmentList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    marginBottom: "1.5rem",
    maxHeight: "520px",
    overflowY: "auto",
    paddingRight: "4px",
  },
  segment: {
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    transition: "box-shadow 0.15s",
  },
  segmentMeta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "0.35rem",
    flexWrap: "wrap",
    gap: "0.25rem",
  },
  speakerLabel: {
    fontWeight: "700",
    fontSize: "0.82rem",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  timestamp: {
    fontSize: "0.75rem",
    color: "#9CA3AF",
    fontVariantNumeric: "tabular-nums",
    fontFamily: "monospace",
  },
  segmentText: {
    margin: 0,
    fontSize: "0.95rem",
    color: "#1F2937",
    lineHeight: "1.65",
  },
  fullText: {
    marginBottom: "1.5rem",
    background: "#F9FAFB",
    border: "1px solid #E5E7EB",
    borderRadius: "8px",
    padding: "1.25rem",
    maxHeight: "400px",
    overflowY: "auto",
  },
  fullTextPre: {
    margin: 0,
    whiteSpace: "pre-wrap",
    fontSize: "0.92rem",
    color: "#374151",
    lineHeight: "1.75",
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  downloadSection: {
    borderTop: "1px solid #F3F4F6",
    paddingTop: "1.25rem",
  },
  downloadLabel: {
    margin: "0 0 0.6rem",
    fontSize: "0.82rem",
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  downloadButtons: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  dlBtn: {
    padding: "6px 16px",
    border: "1.5px solid #D1D5DB",
    borderRadius: "6px",
    background: "#fff",
    color: "#374151",
    fontWeight: "600",
    fontSize: "0.82rem",
    cursor: "pointer",
    transition: "all 0.15s",
    letterSpacing: "0.03em",
  },
};