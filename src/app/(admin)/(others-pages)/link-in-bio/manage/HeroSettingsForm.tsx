"use client";

import Image from "next/image";
import { useRef, useState, useTransition, FormEvent } from "react";
import { useUploadWithProgress } from "@/hooks/useUploadWithProgress";
import type { LinkInBioProfile } from "@/actions/linkInBio";
import { formatMaxUploadLabel } from "@/lib/uploadLimits";

const uploadLabel = formatMaxUploadLabel();

type HeroSettingsFormProps = {
  profile: LinkInBioProfile;
  onSubmit: (formData: FormData) => Promise<void>;
};

export function HeroSettingsForm({ profile, onSubmit }: HeroSettingsFormProps) {
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { uploadFile, progress, isUploading, error } = useUploadWithProgress();
  const [isPending, startTransition] = useTransition();

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setMessage(null);
      const { key } = await uploadFile(file, "linkinbio-profile", file.name);
      setUploadedKey(key);
      setMessage("Avatar berhasil diunggah, klik simpan untuk menerapkan.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error(err);
      setMessage("Gagal mengunggah avatar.");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (uploadedKey) {
      formData.append("uploadedKey", uploadedKey);
    }
    startTransition(async () => {
      await onSubmit(formData);
      setMessage("Perubahan hero berhasil disimpan.");
    });
  };

  const disabled = isUploading || isPending;

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Hero</p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Customize avatar, accent colors, and copy.</h2>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Title</label>
            <input
              type="text"
              name="title"
              defaultValue={profile.title}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700"
              placeholder="SCALE Bazaar 2026"
              required
              disabled={disabled}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Subtitle</label>
            <input
              type="text"
              name="subtitle"
              defaultValue={profile.subtitle}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700"
              placeholder="Discover every tenant and performance"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Primary Button Text</label>
            <input
              type="text"
              name="buttonText"
              defaultValue={profile.buttonText}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700"
              placeholder="Visit Main Site"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Footer Note</label>
            <input
              type="text"
              name="footer"
              defaultValue={profile.footer}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700"
              placeholder="Powered by SCALE"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Accent Color</label>
            <input
              type="text"
              name="accent"
              defaultValue={profile.accent}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700"
              placeholder="#f97316"
              disabled={disabled}
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-2xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled}
          >
            {isPending ? "Saving..." : "Save Hero Content"}
          </button>
          {message && <p className="text-xs text-brand-600">{message}</p>}
        </div>
        <div className="space-y-4 rounded-2xl border border-dashed border-gray-300 p-6 text-sm dark:border-gray-700">
          <div className="flex flex-col items-center gap-4 text-center">
            {profile.avatarUrl ? (
              <Image src={profile.avatarUrl} alt="Avatar" width={160} height={160} className="h-40 w-40 rounded-full object-cover" />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                No Avatar
              </div>
            )}
            <p className="text-gray-500">Recommended: square PNG/JPG.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Upload New Avatar</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-4 py-2.5 text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-600 hover:file:bg-brand-100 dark:border-gray-700"
              disabled={isUploading}
            />
            <p className="mt-1 text-xs text-gray-500">Max {uploadLabel}. Larger files are rejected automatically.</p>
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
        </div>
      </form>
    </section>
  );
}
