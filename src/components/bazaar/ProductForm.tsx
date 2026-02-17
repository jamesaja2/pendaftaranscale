"use client";

import React, { useState } from "react";
import { addProduct, updateProduct, deleteProduct } from "@/actions/product";
import { useUploadWithProgress } from "@/hooks/useUploadWithProgress";
import Image from "next/image";

interface ProductVariant {
  id?: string;
  name: string;
  additionalPrice: number;
  isRequired: boolean;
  isAvailable: boolean;
  order: number;
}

interface ProductAddon {
  id?: string;
  name: string;
  price: number;
  isAvailable: boolean;
  order: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  stock: number | null;
  isAvailable: boolean;
  category: string | null;
  variants?: ProductVariant[];
  addons?: ProductAddon[];
}

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Basic Info
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || "");
  const [category, setCategory] = useState(product?.category || "");
  
  // Pricing & Stock
  const [price, setPrice] = useState(product?.price?.toString() || "0");
  const [stock, setStock] = useState(product?.stock?.toString() || "");
  const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);
  
  // Variants
  const [variants, setVariants] = useState<ProductVariant[]>(
    product?.variants || []
  );
  
  // Add-ons
  const [addons, setAddons] = useState<ProductAddon[]>(
    product?.addons || []
  );

  const { uploadFile, isUploading, progress } = useUploadWithProgress();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar");
      return;
    }

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

  // Variant handlers
  const addVariant = () => {
    setVariants([...variants, {
      name: "",
      additionalPrice: 0,
      isRequired: false,
      isAvailable: true,
      order: variants.length
    }]);
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  // Addon handlers
  const addAddon = () => {
    setAddons([...addons, {
      name: "",
      price: 0,
      isAvailable: true,
      order: addons.length
    }]);
  };

  const updateAddon = (index: number, field: keyof ProductAddon, value: any) => {
    const updated = [...addons];
    updated[index] = { ...updated[index], [field]: value };
    setAddons(updated);
  };

  const removeAddon = (index: number) => {
    setAddons(addons.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const data = {
        name,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
        category: category || undefined,
        price: parseFloat(price) || 0,
        stock: stock ? parseInt(stock) : null,
        isAvailable,
        variants: variants.map((v, idx) => ({ ...v, order: idx })),
        addons: addons.map((a, idx) => ({ ...a, order: idx }))
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
        setError(result.error || "Gagal menyimpan produk");
      }
    } catch (err) {
      setError("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    if (!confirm("Yakin ingin menghapus produk ini?")) return;

    setIsSubmitting(true);
    const result = await deleteProduct(product.id);
    
    if (result.success) {
      onSuccess?.();
    } else {
      setError(result.error || "Gagal menghapus produk");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Informasi Dasar</h3>
        
        {/* Name */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Nama Produk <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Contoh: Nasi Goreng Special"
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
          />
        </div>

        {/* Category */}
        <div>
          <label className="mb-2 block text-sm font-medium">Kategori</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
          >
            <option value="">Pilih Kategori</option>
            <option value="Makanan">Makanan</option>
            <option value="Minuman">Minuman</option>
            <option value="Snack">Snack</option>
            <option value="Dessert">Dessert</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="mb-2 block text-sm font-medium">Deskripsi</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Deskripsi produk..."
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="mb-2 block text-sm font-medium">Gambar Produk</label>
          {imageUrl && (
            <div className="mb-3 relative h-40 w-40">
              <Image
                src={imageUrl}
                alt="Preview"
                fill
                className="rounded-lg object-cover"
              />
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
        </div>
      </div>

      {/* Pricing & Stock */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Harga & Stok</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Price */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Harga Dasar <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0"
                step="500"
                placeholder="0"
                className="w-full rounded-lg border border-stroke bg-transparent py-3 pl-12 pr-4 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
              />
            </div>
          </div>

          {/* Stock */}
          <div>
            <label className="mb-2 block text-sm font-medium">Stok</label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              min="0"
              placeholder="Kosongkan untuk unlimited"
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500">Kosongkan jika stok tidak terbatas</p>
          </div>
        </div>

        {/* Availability */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isAvailable"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="isAvailable" className="text-sm font-medium">
            Produk tersedia untuk dijual
          </label>
        </div>
      </div>

      {/* Variants */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Varian Produk</h3>
          <button
            type="button"
            onClick={addVariant}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            + Tambah Varian
          </button>
        </div>
        
        <p className="text-sm text-gray-500">
          Varian seperti ukuran (S/M/L), tingkat kepedasan, dll. Pelanggan bisa memilih salah satu varian.
        </p>

        {variants.map((variant, index) => (
          <div key={index} className="rounded-lg border border-stroke p-4 dark:border-dark-3">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Nama Varian</label>
                  <input
                    type="text"
                    value={variant.name}
                    onChange={(e) => updateVariant(index, 'name', e.target.value)}
                    placeholder="Contoh: Small, Medium, Large"
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-medium">Harga Tambahan</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                    <input
                      type="number"
                      value={variant.additionalPrice}
                      onChange={(e) => updateVariant(index, 'additionalPrice', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="500"
                      placeholder="0"
                      className="w-full rounded-lg border border-stroke bg-transparent py-2 pl-12 pr-4 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={variant.isRequired}
                    onChange={(e) => updateVariant(index, 'isRequired', e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Wajib dipilih</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={variant.isAvailable}
                    onChange={(e) => updateVariant(index, 'isAvailable', e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Tersedia</span>
                </label>

                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="ml-auto text-sm text-red-500 hover:text-red-700"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add-ons */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Add-ons / Tambahan</h3>
          <button
            type="button"
            onClick={addAddon}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            + Tambah Add-on
          </button>
        </div>
        
        <p className="text-sm text-gray-500">
          Add-on seperti keju extra, sambal extra, es batu, dll. Pelanggan bisa memilih beberapa add-on sekaligus.
        </p>

        {addons.map((addon, index) => (
          <div key={index} className="rounded-lg border border-stroke p-4 dark:border-dark-3">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Nama Add-on</label>
                  <input
                    type="text"
                    value={addon.name}
                    onChange={(e) => updateAddon(index, 'name', e.target.value)}
                    placeholder="Contoh: Extra Keju, Sambal Extra"
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-medium">Harga Add-on</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                    <input
                      type="number"
                      value={addon.price}
                      onChange={(e) => updateAddon(index, 'price', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="500"
                      placeholder="0"
                      className="w-full rounded-lg border border-stroke bg-transparent py-2 pl-12 pr-4 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={addon.isAvailable}
                    onChange={(e) => updateAddon(index, 'isAvailable', e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Tersedia</span>
                </label>

                <button
                  type="button"
                  onClick={() => removeAddon(index)}
                  className="ml-auto text-sm text-red-500 hover:text-red-700"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="flex-1 rounded-lg !bg-blue-600 px-6 py-3 font-semibold !text-white shadow-lg transition hover:!bg-blue-700 hover:scale-105 disabled:opacity-50 dark:!bg-blue-500 dark:hover:!bg-blue-600"
          style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
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
        {product && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="rounded-lg !bg-red-500 px-6 py-3 !text-white shadow-lg transition hover:!bg-red-600 hover:scale-105 disabled:opacity-50"
            style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
          >
            Hapus
          </button>
        )}
      </div>
    </form>
  );
}
