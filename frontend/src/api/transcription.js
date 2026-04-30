const BASE_URL = "http://localhost:8000/api";

export const uploadAudio = async (file, fillerRemovalEnabled, diarizationEnabled) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("filler_removal_enabled", fillerRemovalEnabled);
  formData.append("diarization_enabled", diarizationEnabled);  // 追加

  const res = await fetch(`${BASE_URL}/transcriptions`, {
    method: "POST",
    body: formData,
  });
  return res.json();
};

export const getTranscription = async (jobId) => {
  const res = await fetch(`${BASE_URL}/transcriptions/${jobId}`);
  return res.json();
};

export const downloadTranscription = (jobId, format) => {
  window.open(
    `${BASE_URL}/transcriptions/${jobId}/download?format=${format}`
  );
};