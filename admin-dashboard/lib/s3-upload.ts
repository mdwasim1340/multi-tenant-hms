// This function should be moved to the backend.
// It is not secure to have AWS credentials on the client-side.
export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload file");
  }

  const { url } = await response.json();
  return url;
};
