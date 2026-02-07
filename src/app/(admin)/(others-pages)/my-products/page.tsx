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

  const downloadPDF = async () => {
    const doc = new jsPDF();
    doc.setFont('helvetica');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // === HEADER DENGAN LOGO ===
    try {
      const logoUrl = 'https://ppsntr.nichdant.com/files/resources--inventaris.png';
      const response = await fetch(logoUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      await new Promise((resolve) => {
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const logoWidth = 50;
          doc.addImage(base64data, 'PNG', (pageWidth - logoWidth) / 2, 8, logoWidth, 0);
          resolve(null);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to load logo:', error);
    }
    
    // H1 Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    const titleText = 'KATALOG PRODUK';
    const titleWidth = doc.getTextWidth(titleText);
    doc.text(titleText, (pageWidth - titleWidth) / 2, 35);
    
    // Border bottom
    doc.setDrawColor(51, 51, 51);
    doc.setLineWidth(0.8);
    doc.line(20, 42, pageWidth - 20, 42);
    
    // === INFO SECTION ===
    const infoY = 52;
    const boxHeight = 15;
    const boxWidth = (pageWidth - 50) / 2;
    const gap = 10;
    const col1X = 20;
    const col2X = col1X + boxWidth + gap;
    
    const drawInfoBox = (x: number, y: number, label: string, value: string) => {
      doc.setFillColor(249, 249, 249);
      doc.rect(x, y, boxWidth, boxHeight, 'F');
      doc.setDrawColor(51, 51, 51);
      doc.setFillColor(51, 51, 51);
      doc.rect(x, y, 1, boxHeight, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(85, 85, 85);
      doc.text(label, x + 4, y + 6);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 51, 51);
      doc.text(value, x + 4, y + 12);
      doc.setTextColor(0, 0, 0);
    };
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    
    drawInfoBox(col1X, infoY, 'Tim Anda:', 'Tim Peserta');
    drawInfoBox(col2X, infoY, 'Tanggal Cetak:', dateStr);
    drawInfoBox(col1X, infoY + boxHeight + gap, 'Total Produk:', `${products.length} Produk`);
    drawInfoBox(col2X, infoY + boxHeight + gap, 'Status:', submission ? 'Sudah Submit' : 'Draft');

    // === TABLE ===
    const tableData = products.map((product, idx) => {
      // Build variant & addon details
      let productDetails = product.name;
      if (product.variants && product.variants.length > 0) {
        productDetails += '\n  Varian:';
        product.variants.forEach((v) => {
          const priceStr = v.additionalPrice > 0 ? ` (+Rp ${v.additionalPrice.toLocaleString('id-ID')})` : '';
          productDetails += `\n  • ${v.name}${priceStr}`;
        });
      }
      if (product.addons && product.addons.length > 0) {
        productDetails += '\n  Add-on:';
        product.addons.forEach((a) => {
          productDetails += `\n  • ${a.name} (+Rp ${a.price.toLocaleString('id-ID')})`;
        });
      }
      
      const priceText = `Rp ${product.price?.toLocaleString('id-ID') || 0}`;
      const stockText = product.stock !== null && product.stock !== undefined ? product.stock.toString() : "Unlimited";
      
      return [
        (idx + 1).toString(),
        `PRD-${String(idx + 1).padStart(3, '0')}`,
        productDetails,
        priceText,
        stockText,
      ];
    });

    autoTable(doc, {
      startY: infoY + 2 * boxHeight + 2 * gap + 10,
      head: [["No", "Kode", "Nama Produk & Detail", "Harga Dasar", "Stok"]],
      body: tableData,
      styles: { 
        fontSize: 9,
        font: 'helvetica',
        cellPadding: { top: 2, right: 1.5, bottom: 2, left: 1.5 },
        textColor: [51, 51, 51],
        lineColor: [221, 221, 221],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [51, 51, 51],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'left',
        cellPadding: { top: 2.5, right: 1.5, bottom: 2.5, left: 1.5 }
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 22 },
        2: { cellWidth: 80 }, // Wider for details
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 18, halign: 'center' }
      }
    });

    // === FOOTER ===
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const signBoxWidth = 55;
    const signBoxGap = ((pageWidth - 40) - (3 * signBoxWidth)) / 2;
    
    const signatures = [
      { label: 'Dibuat Oleh,', x: 20 },
      { label: 'Diperiksa Oleh,', x: 20 + signBoxWidth + signBoxGap },
      { label: 'Disetujui Oleh,', x: 20 + 2 * (signBoxWidth + signBoxGap) }
    ];
    
    signatures.forEach((sig) => {
      doc.setFillColor(249, 249, 249);
      doc.rect(sig.x, finalY, signBoxWidth, 35, 'F');
      doc.setDrawColor(221, 221, 221);
      doc.setLineWidth(0.3);
      doc.rect(sig.x, finalY, signBoxWidth, 35, 'S');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 51, 51);
      doc.text(sig.label, sig.x + 3, finalY + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(102, 102, 102);
      doc.text('Nama:', sig.x + 3, finalY + 25);
      doc.text('Tanggal:', sig.x + 3, finalY + 32);
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
