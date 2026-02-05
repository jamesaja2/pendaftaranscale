"use client";

import React, { useEffect, useState } from "react";
import { getTeamInventory, submitInventory } from "@/actions/inventory";
import InventoryList from "@/components/bazaar/InventoryList";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

interface InventorySubmission {
  submittedAt: Date;
  updatedAt: Date;
}

export default function ParticipantInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [submission, setSubmission] = useState<InventorySubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    const result = await getTeamInventory();
    if (result.success) {
      setItems(result.items || []);
      setSubmission(result.submission || null);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      alert("Tambahkan minimal 1 item sebelum submit");
      return;
    }

    if (!confirm("Apakah Anda yakin ingin submit inventaris? Anda masih bisa mengedit setelah submit.")) {
      return;
    }

    setIsSubmitting(true);
    const result = await submitInventory();
    if (result.success) {
      alert("Inventaris berhasil disubmit!");
      loadInventory();
    } else {
      alert(result.error || "Gagal submit inventaris");
    }
    setIsSubmitting(false);
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

  const downloadPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Daftar Inventaris Bazaar", 14, 20);

    doc.setFontSize(12);
    doc.text("Tim Anda", 14, 30);

    // Table
    const tableData = items.map((item) => {
      const details = [];
      if (item.category === "ELEKTRONIK") {
        if (item.watt) details.push(`${item.watt}W`);
        if (item.ampere) details.push(`${item.ampere}A`);
        if (item.voltage) details.push(`${item.voltage}V`);
        if (item.brand) details.push(item.brand);
      } else if (item.material) {
        details.push(item.material);
      }
      if (item.dimensions) details.push(item.dimensions);

      return [
        item.name,
        getCategoryLabel(item.category),
        `${item.quantity} ${item.unit || "pcs"}`,
        item.condition || "-",
        details.join(", ") || "-",
        item.notes || "-",
      ];
    });

    autoTable(doc, {
      startY: 40,
      head: [["Nama Barang", "Kategori", "Jumlah", "Kondisi", "Spesifikasi", "Catatan"]],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save("Inventaris_Tim.pdf");
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg text-gray-500 dark:text-gray-400">Memuat data...</div>
      </div>
    );
  }

  return (
    <>
      <PageBreadcrumb
        pageName="Inventaris Barang"
        items={[
          { name: "Dashboard", path: "/" },
          { name: "Inventaris", path: "/my-inventory" },
        ]}
      />

      <div className="space-y-6">
        {/* Info Banner */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-300">
            ℹ️ Informasi Inventaris
          </h3>
          <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-400">
            <li>• Input semua barang yang akan dibawa saat hari-H bazaar</li>
            <li>• Anda dapat mengedit inventaris kapan saja, bahkan setelah submit</li>
            <li>• Download PDF untuk dokumentasi dan keperluan panitia</li>
            <li>• Pastikan informasi spesifikasi barang akurat, terutama untuk barang elektronik</li>
          </ul>
        </div>

        {/* Status Card */}
        {submission ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-900 dark:text-green-300">
                  ✓ Inventaris sudah disubmit
                </p>
                <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                  Terakhir update:{" "}
                  {new Date(submission.updatedAt).toLocaleString("id-ID", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <button
                onClick={downloadPDF}
                disabled={items.length === 0}
                className="rounded-lg bg-green-600 px-6 py-2 text-white transition hover:bg-green-700 disabled:opacity-50"
              >
                Download PDF
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-yellow-900 dark:text-yellow-300">
                  ⚠️ Belum submit inventaris
                </p>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                  Tambahkan item lalu klik tombol submit di bawah
                </p>
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || items.length === 0}
                className="rounded-lg bg-primary px-6 py-2 text-white transition hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Inventaris"}
              </button>
            </div>
          </div>
        )}

        {/* Inventory List */}
        <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-dark dark:text-white">
              Daftar Item ({items.length})
            </h2>
            {submission && items.length > 0 && (
              <button
                onClick={downloadPDF}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white transition hover:bg-blue-600"
              >
                Download PDF
              </button>
            )}
          </div>
          <InventoryList items={items} onRefresh={loadInventory} editable={true} />
        </div>

        {/* Submit Button at Bottom */}
        {!submission && items.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-8 py-3 text-lg font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Inventaris"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
