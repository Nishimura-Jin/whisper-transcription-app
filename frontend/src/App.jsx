import { BrowserRouter, Routes, Route } from "react-router-dom";
import UploadPage from "./pages/UploadPage";

function Nav() {
  return (
    <header style={{ borderBottom: "1px solid #e5e7eb", padding: "1rem 2rem", marginBottom: "1rem" }}>
      <h1 style={{ margin: 0, fontSize: "1.25rem" }}>
        🎙️ Whisper 文字起こしアプリ
      </h1>
    </header>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<UploadPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;