"use client";

import { useCallback, useState } from "react";

type UploadResponse = {
  success: boolean;
  key: string;
  url: string | null;
};

type UploadTargetSuccess = {
  success: true;
  key: string;
  uploadUrl: string;
  method?: string;
  headers?: Record<string, string>;
  publicUrl: string | null;
  maxUploadBytes: number;
  maxUploadMb: number;
};

type UploadTargetError = {
  success: false;
  error?: string;
};

type UploadTargetResponse = UploadTargetSuccess | UploadTargetError;

export function useUploadWithProgress() {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestUploadTarget = useCallback(async (folder: string, filename: string) => {
    const response = await fetch("/api/upload/presign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ folder, filename }),
    });

    let payload: UploadTargetResponse;
    try {
      payload = (await response.json()) as UploadTargetResponse;
    } catch {
      throw new Error("Invalid server response");
    }

    if (!response.ok || !payload?.success) {
      const message = payload?.success === false && payload.error ? payload.error : "Unable to prepare upload";
      throw new Error(message);
    }

    return payload;
  }, []);

  const performUpload = useCallback(
    (target: UploadTargetSuccess, file: File, resolvedFilename: string) => {
      return new Promise<UploadResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append("file", file, resolvedFilename);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setProgress(percent);
          }
        };

        xhr.onreadystatechange = () => {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve({ success: true, key: target.key, url: target.publicUrl });
            } else {
              const message = xhr.responseText || "Upload failed";
              reject(new Error(message));
            }
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network error while uploading"));
        };

        xhr.open(target.method || "PUT", target.uploadUrl, true);
        if (target.headers) {
          Object.entries(target.headers).forEach(([header, value]) => {
            if (value) {
              xhr.setRequestHeader(header, value);
            }
          });
        }
        xhr.send(formData);
      });
    },
    [setProgress]
  );

  const uploadFile = useCallback(
    async (file: File, folder?: string, filename?: string) => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      const resolvedFilename = filename?.trim() || file.name || `upload-${Date.now()}`;
      const targetFolderInput = typeof folder === "string" ? folder : "uploads";
      const targetFolder = targetFolderInput.trim() || "uploads";

      try {
        const target = await requestUploadTarget(targetFolder, resolvedFilename);
        if (file.size > target.maxUploadBytes) {
          throw new Error(`File exceeds ${target.maxUploadMb}MB limit`);
        }
        const result = await performUpload(target, file, resolvedFilename);
        setProgress(100);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      } finally {
        setIsUploading(false);
      }
    },
    [performUpload, requestUploadTarget]
  );

  const resetProgress = useCallback(() => {
    setProgress(0);
    setError(null);
    setIsUploading(false);
  }, []);

  return { uploadFile, progress, isUploading, error, resetProgress };
}
