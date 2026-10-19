/**
 * Upload files with XHR so we can track progress.
 * Returns the parsed JSON response on success, throws on error.
 */
export function uploadWithProgress(
  url: string,
  files: File[],
  fieldName: string,
  onProgress: (pct: number) => void
): Promise<{ urls: string[] }> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    files.forEach((f) => formData.append(fieldName, f));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText) as Record<string, unknown>;
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data as { urls: string[] });
        } else {
          reject(new Error((data.error as string) ?? "Upload failed"));
        }
      } catch {
        reject(new Error("Upload failed"));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed — please try again"));
    xhr.send(formData);
  });
}
