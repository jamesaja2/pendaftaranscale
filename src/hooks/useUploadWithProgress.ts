"use client";

import { useCallback, useState } from "react";

type UploadResponse = {
  success: boolean;
  key: string;
  url: string | null;
};

export function useUploadWithProgress() {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    (file: File, folder: string, filename?: string) => {
      return new Promise<UploadResponse>((resolve, reject) => {
        setIsUploading(true);
        setProgress(0);
        setError(null);

        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);
        if (filename) {
          formData.append("filename", filename);
        }

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setProgress(percent);
          }
        };

        xhr.onreadystatechange = () => {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            setIsUploading(false);
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const parsed = JSON.parse(xhr.responseText) as UploadResponse;
                if (!parsed?.success) {
                  setError("Upload failed");
                  reject(new Error("Upload failed"));
                  return;
                }
                setProgress(100);
                resolve(parsed);
              } catch (err) {
                setError("Invalid server response");
                reject(err instanceof Error ? err : new Error("Invalid server response"));
              }
            } else {
              const message = xhr.responseText || "Upload failed";
              setError(message);
              reject(new Error(message));
            }
          }
        };

        xhr.onerror = () => {
          setIsUploading(false);
          const err = new Error("Network error while uploading");
          setError(err.message);
          reject(err);
        };

        xhr.open("POST", "/api/upload", true);
        xhr.send(formData);
      });
    },
    []
  );

  const resetProgress = useCallback(() => {
    setProgress(0);
    setError(null);
    setIsUploading(false);
  }, []);

  return { uploadFile, progress, isUploading, error, resetProgress };
}
