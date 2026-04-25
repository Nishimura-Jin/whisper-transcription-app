import { useEffect, useState } from "react";
import { getTranscriptions, downloadTranscription, toggleFiller } from "../api/transcription";

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getTranscriptions().then(setHistory);
  }, []);

  const handleToggleFiller = async (item) => {
    const updated = await toggleFiller(item.id, !item.filler_removal_enabled);
    setHistory((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
    if (selected?.id === updated.id) setSelected(updated);
  };

  const displayText = (item) =>
    item.filler_removal_enabled && item.filler_removed
      ? item.filler_removed
      : item.transcript;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>履歴一覧</h2>
      {history.length === 0 && <p>履歴がありません</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {history.map((item) => (
          <li
            key={item.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{item.filename}</strong>
                <span style={{ marginLeft: "1rem", color: "#888", fontSize: "0.85rem" }}>
                  {new Date(item.created_at).toLocaleString("ja-JP")}
                </span>
                <span
                  style={{
                    marginLeft: "1rem",
                    color: item.status === "completed" ? "green" : "orange",
                    fontSize: "0.85rem",
                  }}
                >
                  {item.status}
                </span>
              </div>
              <button onClick={() => setSelected(selected?.id === item.id ? null : item)}>
                {selected?.id === item.id ? "閉じる" : "詳細を見る"}
              </button>
            </div>

            {selected?.id === item.id && item.status === "completed" && (
              <div style={{ marginTop: "1rem" }}>
                {/* フィラー除去トグル */}
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <input
                    type="checkbox"
                    checked={selected.filler_removal_enabled}
                    onChange={() => handleToggleFiller(selected)}
                  />
                  フィラー除去
                  {!selected.filler_removed && selected.filler_removal_enabled && (
                    <span style={{ color: "orange", fontSize: "0.8rem" }}>
                      ※初回アップロード時にフィラー除去が無効だったため、除去済みテキストがありません
                    </span>
                  )}
                </label>

                {/* 文字起こし本文 */}
                <p
                  style={{
                    whiteSpace: "pre-wrap",
                    background: "#f5f5f5",
                    padding: "1rem",
                    borderRadius: "4px",
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {displayText(selected)}
                </p>

                {/* ダウンロードボタン */}
                <div style={{ marginTop: "0.5rem" }}>
                  {["txt", "srt", "vtt", "tsv", "json"].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() =>
                        downloadTranscription(selected.id, fmt, selected.filler_removal_enabled)
                      }
                      style={{ marginRight: "0.5rem" }}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}