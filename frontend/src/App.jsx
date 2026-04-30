import { BrowserRouter, Routes, Route } from "react-router-dom";
import UploadPage from "./pages/UploadPage";

function Nav() {
  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <div style={styles.brand}>
          <span style={styles.brandMark} />
          <span style={styles.brandName}>Whisper Transcription</span>
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    background: "#fff",
    borderBottom: "1px solid #E5E7EB",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  inner: {
    maxWidth: "860px",
    margin: "0 auto",
    padding: "0 2rem",
    height: "56px",
    display: "flex",
    alignItems: "center",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  brandMark: {
    display: "inline-block",
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
  },
  brandName: {
    fontSize: "1rem",
    fontWeight: "700",
    color: "#111827",
    letterSpacing: "-0.01em",
  },
};

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