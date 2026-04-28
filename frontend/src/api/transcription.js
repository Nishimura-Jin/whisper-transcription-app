const BASE_URL = "http://localhost:8000/api";

export const uploadAudio = async (file, fillerRemovalEnabled) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("filler_removal_enabled", fillerRemovalEnabled);

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