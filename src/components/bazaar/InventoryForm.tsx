"use client";

import React, { useState } from "react";
import {
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from "@/actions/inventory";

type ItemCategory = "ELEKTRONIK" | "PERALATAN" | "FURNITURE" | "DEKORASI" | "LAINNYA";

interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  unit?: string | null;
  description?: string | null;
  watt?: number | null;
  ampere?: number | null;
  voltage?: number | null;
  brand?: string | null;
  material?: string | null;
  dimensions?: string | null;
  weight?: number | null;
  condition?: string | null;
  notes?: string | null;
}

interface InventoryFormProps {
  item?: InventoryItem;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function InventoryForm({ item, onSuccess, onCancel }: InventoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState(item?.name || "");
  const [category, setCategory] = useState<ItemCategory>(item?.category || "ELEKTRONIK");
  const [quantity, setQuantity] = useState(item?.quantity || 1);
  const [unit, setUnit] = useState(item?.unit || "");
  const [description, setDescription] = useState(item?.description || "");
  const [condition, setCondition] = useState(item?.condition || "");
  const [notes, setNotes] = useState(item?.notes || "");

  // Elektronik fields
  const [watt, setWatt] = useState(item?.watt?.toString() || "");
  const [ampere, setAmpere] = useState(item?.ampere?.toString() || "");
  const [voltage, setVoltage] = useState(item?.voltage?.toString() || "");
  const [brand, setBrand] = useState(item?.brand || "");

  // Peralatan fields
  const [material, setMaterial] = useState(item?.material || "");
  const [dimensions, setDimensions] = useState(item?.dimensions || "");
  const [weight, setWeight] = useState(item?.weight?.toString() || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const data = {
        name,
        category,
        quantity,
        unit: unit || undefined,
        description: description || undefined,
        condition: condition || undefined,
        notes: notes || undefined,
        watt: watt ? parseFloat(watt) : undefined,
        ampere: ampere ? parseFloat(ampere) : undefined,
        voltage: voltage ? parseFloat(voltage) : undefined,
        brand: brand || undefined,
        material: material || undefined,
        dimensions: dimensions || undefined,
        weight: weight ? parseFloat(weight) : undefined,
      };

      let result;
      if (item) {
        result = await updateInventoryItem(item.id, data);
      } else {
        result = await addInventoryItem(data);
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

  const renderCategoryFields = () => {
    switch (category) {
      case "ELEKTRONIK":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Watt
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={watt}
                  onChange={(e) => setWatt(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
                  placeholder="e.g., 100"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Ampere
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={ampere}
                  onChange={(e) => setAmpere(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
                  placeholder="e.g., 0.5"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Voltage (V)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={voltage}
                  onChange={(e) => setVoltage(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
                  placeholder="e.g., 220"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Brand/Merk
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
                  placeholder="e.g., Philips"
                />
              </div>
            </div>
          </div>
        );

      case "PERALATAN":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Material/Bahan
                </label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
                  placeholder="e.g., Stainless Steel"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Dimensi (P x L x T)
                </label>
                <input
                  type="text"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
                  placeholder="e.g., 50cm x 30cm x 20cm"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Berat (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
                  placeholder="e.g., 5.5"
                />
              </div>
            </div>
          </div>
        );

      case "FURNITURE":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Material/Bahan
                </label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
                  placeholder="e.g., Kayu Jati"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Dimensi (P x L x T)
                </label>
                <input
                  type="text"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
                  placeholder="e.g., 120cm x 60cm x 75cm"
                />
              </div>
            </div>
          </div>
        );

      case "DEKORASI":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Material/Bahan
                </label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
                  placeholder="e.g., Kertas, Plastik, Kain"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Dimensi
                </label>
                <input
                  type="text"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
                  placeholder="e.g., 100cm x 200cm"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
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
            Nama Barang <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
            placeholder="e.g., Rice Cooker"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
            Kategori <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value as ItemCategory)}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
          >
            <option value="ELEKTRONIK">Elektronik</option>
            <option value="PERALATAN">Peralatan</option>
            <option value="FURNITURE">Furniture</option>
            <option value="DEKORASI">Dekorasi</option>
            <option value="LAINNYA">Lainnya</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              Jumlah <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
              placeholder="e.g., 2"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              Satuan
            </label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
              placeholder="e.g., pcs, buah, set"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
            Kondisi
          </label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
          >
            <option value="">Pilih kondisi</option>
            <option value="Baru">Baru</option>
            <option value="Bekas Baik">Bekas Baik</option>
            <option value="Bekas Cukup">Bekas Cukup</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
            Deskripsi
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
            placeholder="Deskripsi singkat barang..."
          />
        </div>
      </div>

      {/* Category-specific fields */}
      {renderCategoryFields()}

      {/* Notes */}
      <div>
        <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
          Catatan Tambahan
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
          placeholder="Catatan atau informasi tambahan..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-lg bg-primary px-6 py-3 text-white transition hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? "Menyimpan..." : item ? "Update Item" : "Tambah Item"}
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
