import { useState } from "react";
import UploadForm from "../components/UploadForm";
import TranscriptResult from "../components/TranscriptResult";

export default function UploadPage() {
  const [result, setResult] = useState(null);

  return (
    <div>
      <UploadForm onComplete={setResult} />
      {result && <TranscriptResult data={result} />}
    </div>
  );
}