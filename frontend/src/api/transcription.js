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

export const getTranscription = async (id) => {
  const res = await fetch(`${BASE_URL}/transcriptions/${id}`);
  return res.json();
};

export const getTranscriptions = async () => {
  const res = await fetch(`${BASE_URL}/transcriptions`);
  return res.json();
};

export const downloadTranscription = (id, format, useFillerRemoved = false) => {
  window.open(
    `${BASE_URL}/transcriptions/${id}/download?format=${format}&use_filler_removed=${useFillerRemoved}`
  );
};