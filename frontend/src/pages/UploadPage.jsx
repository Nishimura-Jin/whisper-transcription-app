import { useState } from "react";
import UploadForm from "../components/UploadForm";
import TranscriptResult from "../components/TranscriptResult";

export default function UploadPage() {
  const [result, setResult] = useState(null);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <UploadForm onComplete={setResult} />
        {result && <TranscriptResult data={result} />}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#F3F4F6",
    padding: "2.5rem 1rem",
  },
  container: {
    maxWidth: "860px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
};