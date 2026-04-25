import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import UploadPage from "./pages/UploadPage";
import HistoryPage from "./pages/HistoryPage";

function Nav() {
  const location = useLocation();
  const linkStyle = (path) => ({
    marginRight: "1.5rem",
    textDecoration: "none",
    fontWeight: location.pathname === path ? "bold" : "normal",
    color: location.pathname === path ? "#2563eb" : "#555",
    borderBottom: location.pathname === path ? "2px solid #2563eb" : "none",
    paddingBottom: "4px",
  });

  return (
    <header style={{ borderBottom: "1px solid #e5e7eb", padding: "1rem 2rem", marginBottom: "1rem" }}>
      <h1 style={{ margin: 0, marginBottom: "0.5rem", fontSize: "1.25rem" }}>
        🎙️ Whisper 文字起こしアプリ
      </h1>
      <nav>
        <Link to="/" style={linkStyle("/")}>アップロード</Link>
        <Link to="/history" style={linkStyle("/history")}>履歴一覧</Link>
      </nav>
    </header>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;