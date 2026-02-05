"use client";

import React, { useState } from "react";
import InventoryForm from "./InventoryForm";
import { deleteInventoryItem } from "@/actions/inventory";

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

interface InventoryListProps {
  items: InventoryItem[];
  onRefresh: () => void;
  editable?: boolean;
}

export default function InventoryList({ items, onRefresh, editable = true }: InventoryListProps) {
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleDelete = async (itemId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus item ini?")) return;

    const result = await deleteInventoryItem(itemId);
    if (result.success) {
      onRefresh();
    } else {
      alert(result.error || "Gagal menghapus item");
    }
  };

  const getCategoryLabel = (category: ItemCategory) => {
    const labels: Record<ItemCategory, string> = {
      ELEKTRONIK: "Elektronik",
      PERALATAN: "Peralatan",
      FURNITURE: "Furniture",
      DEKORASI: "Dekorasi",
      LAINNYA: "Lainnya",
    };
    return labels[category];
  };

  const renderItemDetails = (item: InventoryItem) => {
    const details = [];

    if (item.category === "ELEKTRONIK") {
      if (item.watt) details.push(`Watt: ${item.watt}W`);
      if (item.ampere) details.push(`Ampere: ${item.ampere}A`);
      if (item.voltage) details.push(`Voltage: ${item.voltage}V`);
      if (item.brand) details.push(`Brand: ${item.brand}`);
    }

    if (item.category === "PERALATAN" || item.category === "FURNITURE" || item.category === "DEKORASI") {
      if (item.material) details.push(`Material: ${item.material}`);
      if (item.dimensions) details.push(`Dimensi: ${item.dimensions}`);
      if (item.weight) details.push(`Berat: ${item.weight}kg`);
    }

    return details;
  };

  if (showAddForm) {
    return (
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
        <h3 className="mb-4 text-xl font-semibold text-dark dark:text-white">
          Tambah Item Baru
        </h3>
        <InventoryForm
          onSuccess={() => {
            setShowAddForm(false);
            onRefresh();
          }}
          onCancel={() => setShowAddForm(false)}
        />
      </div>
    );
  }

  if (editingItem) {
    return (
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
        <h3 className="mb-4 text-xl font-semibold text-dark dark:text-white">
          Edit Item
        </h3>
        <InventoryForm
          item={editingItem}
          onSuccess={() => {
            setEditingItem(null);
            onRefresh();
          }}
          onCancel={() => setEditingItem(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {editable && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-lg bg-primary px-6 py-3 text-white transition hover:bg-primary/90"
          >
            + Tambah Item
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-lg border border-stroke bg-white p-8 text-center dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-gray-500 dark:text-gray-400">
            Belum ada item inventaris. {editable && "Klik tombol di atas untuk menambah item."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-stroke bg-white p-5 shadow-sm transition hover:shadow-md dark:border-dark-3 dark:bg-gray-dark"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-dark dark:text-white">
                    {item.name}
                  </h4>
                  <span className="mt-1 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {getCategoryLabel(item.category)}
                  </span>
                </div>
              </div>

              <div className="mb-3 space-y-1 text-sm">
                <p className="text-dark dark:text-white">
                  <span className="font-medium">Jumlah:</span> {item.quantity}{" "}
                  {item.unit || "pcs"}
                </p>
                {item.condition && (
                  <p className="text-dark dark:text-white">
                    <span className="font-medium">Kondisi:</span> {item.condition}
                  </p>
                )}
              </div>

              {item.description && (
                <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
              )}

              {renderItemDetails(item).length > 0 && (
                <div className="mb-3 space-y-1 rounded-lg bg-gray-50 p-3 text-xs dark:bg-dark-2">
                  {renderItemDetails(item).map((detail, idx) => (
                    <p key={idx} className="text-gray-600 dark:text-gray-400">
                      {detail}
                    </p>
                  ))}
                </div>
              )}

              {item.notes && (
                <p className="mb-3 rounded-lg bg-yellow-50 p-3 text-xs text-gray-600 dark:bg-yellow-900/20 dark:text-gray-400">
                  <span className="font-medium">Catatan:</span> {item.notes}
                </p>
              )}

              {editable && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-sm text-white transition hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm text-white transition hover:bg-red-600"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
