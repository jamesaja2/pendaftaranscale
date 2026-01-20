"use client";

import Image from "next/image";
import { FormEvent, useRef, useState, useTransition } from "react";
import type { LinkInBioSlide } from "@/actions/linkInBio";
import { useUploadWithProgress } from "@/hooks/useUploadWithProgress";
import { formatMaxUploadLabel } from "@/lib/uploadLimits";

const uploadLabel = formatMaxUploadLabel();

type SliderManagerProps = {
  slides: LinkInBioSlide[];
  onAddSlide: (formData: FormData) => Promise<void>;
  onDeleteSlide: (formData: FormData) => Promise<void>;
};

export function SliderManager({ slides, onAddSlide, onDeleteSlide }: SliderManagerProps) {
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);
  const [pendingDeleteKey, setPendingDeleteKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { uploadFile, progress, isUploading, error } = useUploadWithProgress();
  const [isAdding, startAddTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const { key } = await uploadFile(file, "linkinbio-slider", file.name);
      setUploadedKey(key);
      setMessage("Banner siap diunggah. Klik Add Slide untuk menyimpan.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error(err);
      setMessage("Gagal mengunggah banner.");
    }
  };

  const handleAddSlide = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (uploadedKey) {
      formData.append("uploadedKey", uploadedKey);
    }
    startAddTransition(async () => {
      await onAddSlide(formData);
      setUploadedKey(null);
      setMessage("Slide berhasil ditambahkan.");
      event.currentTarget.reset();
    });
  };

  const handleDelete = (key: string) => {
    const formData = new FormData();
    formData.append("key", key);
    setPendingDeleteKey(key);
    startDeleteTransition(async () => {
      await onDeleteSlide(formData);
      setPendingDeleteKey(null);
    });
  };

  const disableAdd = isUploading || isAdding || (!uploadedKey && isUploading);

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Slider</p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upload hero banners with outbound links.</h2>
      </div>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {slides.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700">
              No slides yet.
            </div>
          )}
          {slides.map((slide) => (
            <div key={slide.key} className="rounded-2xl border border-gray-200 bg-white/60 shadow-sm dark:border-gray-700 dark:bg-gray-900/60">
              <div className="overflow-hidden rounded-t-2xl border-b border-gray-100 dark:border-gray-800">
                <Image src={slide.url} alt="Slide" width={400} height={320} className="h-48 w-full object-cover" />
              </div>
              <div className="space-y-2 p-4 text-sm">
                <p className="truncate font-semibold text-gray-900 dark:text-gray-100">{slide.link || "No link"}</p>
                <button
                  onClick={() => handleDelete(slide.key)}
                  className="text-xs font-semibold text-red-500 hover:text-red-600"
                  disabled={isDeleting && pendingDeleteKey === slide.key}
                >
                  {isDeleting && pendingDeleteKey === slide.key ? "Removing..." : "Remove Slide"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddSlide} className="rounded-2xl border border-dashed border-gray-300 p-6 dark:border-gray-700">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Banner Image</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                required={!uploadedKey}
                onChange={handleFileChange}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-4 py-2.5 text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-600 hover:file:bg-brand-100 dark:border-gray-700"
                disabled={isUploading}
              />
              <p className="mt-1 text-xs text-gray-500">Max {uploadLabel}. Use 9:16 or 4:5 ratio for best fit.</p>
              {isUploading && (
                <div className="mt-3">
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div className="h-2 rounded-full bg-brand-500" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-brand-600">{progress}% uploaded</p>
                </div>
              )}
              {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Destination Link</label>
              <input
                type="url"
                name="link"
                placeholder="https://"
                className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700"
                disabled={disableAdd}
              />
              <p className="mt-1 text-xs text-gray-500">Optional. Leave blank for static promo.</p>
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 w-full rounded-2xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isAdding || isUploading || !uploadedKey}
          >
            {isAdding ? "Saving..." : "Add Slide"}
          </button>
          {message && <p className="mt-2 text-xs text-brand-600">{message}</p>}
        </form>
      </div>
    </section>
  );
}
