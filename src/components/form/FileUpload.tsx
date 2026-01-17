"use client";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: Record<string, string[]>;
  label?: string;
  previewUrl?: string;
}

export default function FileUpload({ onFileSelect, accept, label = "Drag & Drop file here", previewUrl }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(previewUrl || null);
  const [fileName, setFileName] = useState<string>("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFileName(file.name);
      onFileSelect(file);
      
      // Create preview if image
      if (file.type.startsWith("image/")) {
        setPreview(URL.createObjectURL(file));
      } else {
          setPreview(null);
      }
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
      onDrop, 
      accept: accept || {
          'image/*': [],
          'application/pdf': []
      },
      multiple: false
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition
        ${isDragActive ? "border-brand-500 bg-brand-50" : "border-gray-300 dark:border-gray-600 hover:border-brand-400"}
        `}
      >
        <input {...getInputProps()} />
        {preview ? (
            <div className="flex flex-col items-center">
                 {/* Only show image preview if it's an image string or object URL */}
                 {(preview.startsWith("blob:") || preview.match(/\.(jpeg|jpg|gif|png|svg)$/i)) ? (
                      <img src={preview} alt="Preview" className="max-h-48 object-contain mb-2 rounded" />
                 ) : (
                     <div className="p-4 bg-gray-100 rounded mb-2">📄 File Selected</div>
                 )}
                <p className="text-sm text-gray-500">{fileName || "Change File"}</p>
            </div>
        ) : (
            <div>
                 <p className="text-gray-600 dark:text-gray-300 font-medium">{label}</p>
                 <p className="text-xs text-gray-400 mt-1">or click to select</p>
            </div>
        )}
      </div>
    </div>
  );
}
