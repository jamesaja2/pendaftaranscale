"use client";
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface MultiFileUploadProps {
  onFilesSelect: (files: File[]) => void;
  accept?: Record<string, string[]>;
  label?: string;
}

export default function MultiFileUpload({ onFilesSelect, accept, label = "Drag & Drop files here" }: MultiFileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFilesSelect(acceptedFiles);
    }
  }, [onFilesSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
      onDrop, 
      accept: accept || {
          'image/*': []
      },
      multiple: true
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
        <div className="flex flex-col items-center">
            <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
