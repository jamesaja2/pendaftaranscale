"use client";

import React, { useEffect, useState } from "react";
import { getTeamProducts, submitProducts } from "@/actions/product";
import ProductList from "@/components/bazaar/ProductList";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Product {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  stock: number | null;
  isAvailable: boolean;
  category: string | null;
  variants?: Array<{
    id?: string;
    name: string;
    additionalPrice: number;
    isRequired: boolean;
    isAvailable: boolean;
    order: number;
  }>;
  addons?: Array<{
    id?: string;
    name: string;
    price: number;
    isAvailable: boolean;
    order: number;
  }>;
}

interface ProductSubmission {
  submittedAt: Date;
  updatedAt: Date;
}

export default function ParticipantProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [submission, setSubmission] = useState<ProductSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const result = await getTeamProducts();
    if (result.success) {
      setProducts(result.products || []);
      setSubmission(result.submission || null);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (products.length === 0) {
      alert("Tambahkan minimal 1 produk sebelum submit");
      return;
    }

    if (!confirm("Apakah Anda yakin ingin submit katalog produk? Anda masih bisa mengedit setelah submit.")) {
      return;
    }

    setIsSubmitting(true);
    const result = await submitProducts();
    if (result.success) {
      alert("Katalog produk berhasil disubmit!");
      loadProducts();
    } else {
      alert(result.error || "Gagal submit katalog produk");
    }
    setIsSubmitting(false);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Katalog Produk Bazaar", 14, 20);

    doc.setFontSize(12);
    doc.text("Tim Anda", 14, 30);

    // Table
    const tableData = products.map((product) => {
      const variantCount = product.variants?.length || 0;
      const addonCount = product.addons?.length || 0;
      const variantText = variantCount > 0 ? `${variantCount} varian` : "-";
      const addonText = addonCount > 0 ? `${addonCount} add-on` : "-";
      const priceText = `Rp ${product.price?.toLocaleString('id-ID') || 0}`;
      
      return [
        product.name,
        priceText,
        variantText,
        addonText,
        product.stock !== null && product.stock !== undefined ? product.stock.toString() : "Unlimited",
      ];
    });

    autoTable(doc, {
      startY: 40,
      head: [["Nama Produk", "Harga", "Varian", "Add-on", "Stok"]],
      body: tableData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        1: { halign: 'right' }, // Price align right
        2: { halign: 'center' }, // Variant count center
        3: { halign: 'center' }, // Addon count center
        4: { halign: 'center' }, // Stock center
      },
    });

    doc.save("Katalog_Produk_Tim.pdf");
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
      <PageBreadcrumb pageTitle="Katalog Produk" />

      <div className="space-y-6">
        {/* Info Banner */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-300">
            ℹ️ Informasi Katalog Produk
          </h3>
          <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-400">
            <li>• Input semua produk yang akan dijual saat bazaar</li>
            <li>• Anda dapat mengedit katalog kapan saja, bahkan setelah submit</li>
            <li>• Upload gambar produk untuk menarik pembeli</li>
            <li>• Tambahkan deskripsi yang menarik untuk setiap produk</li>
            <li>• Download PDF untuk dokumentasi dan promosi</li>
          </ul>
        </div>

        {/* Status Card */}
        {submission ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-900 dark:text-green-300">
                  ✓ Katalog produk sudah disubmit
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
                disabled={products.length === 0}
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
                  ⚠️ Belum submit katalog produk
                </p>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                  Tambahkan produk lalu klik tombol submit di bawah
                </p>
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || products.length === 0}
                className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {isSubmitting ? "Submitting..." : "Submit Katalog"}
              </button>
            </div>
          </div>
        )}

        {/* Product List */}
        <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-dark dark:text-white">
              Daftar Produk ({products.length})
            </h2>
            {submission && products.length > 0 && (
              <button
                onClick={downloadPDF}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white transition hover:bg-blue-600"
              >
                Download PDF
              </button>
            )}
          </div>
          <ProductList products={products} onRefresh={loadProducts} editable={true} />
        </div>

        {/* Submit Button at Bottom */}
        {!submission && products.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isSubmitting ? "Submitting..." : "Submit Katalog Produk"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
