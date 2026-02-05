"use client";

import React, { useState } from "react";
import { addProduct, updateProduct, deleteProduct } from "@/actions/product";
import { useUploadWithProgress } from "@/hooks/useUploadWithProgress";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  variant?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  stock?: number | null;
}

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState(product?.name || "");
  const [variant, setVariant] = useState(product?.variant || "");
  const [description, setDescription] = useState(product?.description || "");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || "");
  const [stock, setStock] = useState(product?.stock?.toString() || "");

  const { uploadFile, isUploading, progress } = useUploadWithProgress();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5MB");
      return;
    }

    setError("");
    const result = await uploadFile(file);
    
    if (result.success && result.url) {
      setImageUrl(result.url);
    } else {
      setError("Gagal upload gambar");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const data = {
        name,
        variant: variant || undefined,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
        stock: stock ? parseInt(stock) : undefined,
      };

      let result;
      if (product) {
        result = await updateProduct(product.id, data);
      } else {
        result = await addProduct(data);
      }

      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.error || "Terjadi kesalahan");
      }
    } catch (err) {
      setError("Terjadi kesalahan");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
            Nama Produk <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
            placeholder="e.g., Nasi Goreng"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
            Varian
          </label>
          <input
            type="text"
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
            placeholder="e.g., Pedas, Original, Jumbo"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
            Deskripsi Produk
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
            placeholder="Jelaskan produk Anda..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
            Stok (Opsional)
          </label>
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
            placeholder="e.g., 50"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Kosongkan jika stok tidak terbatas
          </p>
        </div>

        {/* Image Upload */}
        <div>
          <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
            Gambar Produk
          </label>
          
          {imageUrl && (
            <div className="mb-3 relative h-48 w-full overflow-hidden rounded-lg border border-stroke dark:border-dark-3">
              <Image
                src={imageUrl}
                alt="Product preview"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="absolute right-2 top-2 rounded-full bg-red-500 p-2 text-white transition hover:bg-red-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isUploading}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
          />
          
          {isUploading && (
            <div className="mt-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-dark-3">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Uploading... {progress}%
              </p>
            </div>
          )}

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Format: JPG, PNG, WebP. Maksimal 5MB
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="flex-1 rounded-lg bg-primary px-6 py-3 text-white transition hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? "Menyimpan..." : product ? "Update Produk" : "Tambah Produk"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-stroke px-6 py-3 transition hover:bg-gray-50 dark:border-dark-3 dark:hover:bg-dark-3"
          >
            Batal
          </button>
        )}
      </div>
    </form>
  );
}
