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

interface Team {
  id: string;
  name: string | null;
  leaderName: string | null;
  boothLocationId: string | null;
}

export default function ParticipantInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [submission, setSubmission] = useState<InventorySubmission | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
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
      setTeam(result.team || null);
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

  const downloadPDF = async () => {
    if (!team) return;
    
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
    
    // H1 Title - 24px, uppercase
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    const titleText = 'DAFTAR INVENTARIS';
    const titleWidth = doc.getTextWidth(titleText);
    doc.text(titleText, (pageWidth - titleWidth) / 2, 35);
    
    // Border bottom - 3px solid #333
    doc.setDrawColor(51, 51, 51);
    doc.setLineWidth(0.8);
    doc.line(20, 42, pageWidth - 20, 42);
    
    // === INFO SECTION (Grid 2x2) ===
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
    
    drawInfoBox(col1X, infoY, 'Nama Tim:', team.name || '-');
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    drawInfoBox(col2X, infoY, 'Tanggal Cetak:', dateStr);
    
    drawInfoBox(col1X, infoY + boxHeight + gap, 'Penanggung Jawab:', team.leaderName || '-');
    drawInfoBox(col2X, infoY + boxHeight + gap, 'Total Item:', `${items.length} Item`);

    // === TABLE ===
    const tableData = items.map((item, idx) => {
      // Build item details with all specifications
      let itemDetails = item.name;
      itemDetails += `\n  Kategori: ${getCategoryLabel(item.category)}`;
      itemDetails += `\n  Kondisi: ${item.condition || "Baik"}`;
      
      // Add category-specific specs
      if (item.category === "ELEKTRONIK") {
        const electronicSpecs = [];
        if (item.watt) electronicSpecs.push(`Watt: ${item.watt}W`);
        if (item.ampere) electronicSpecs.push(`Ampere: ${item.ampere}A`);
        if (item.voltage) electronicSpecs.push(`Voltage: ${item.voltage}V`);
        if (item.brand) electronicSpecs.push(`Brand: ${item.brand}`);
        if (electronicSpecs.length > 0) {
          itemDetails += `\n  Spesifikasi: ${electronicSpecs.join(', ')}`;
        }
      }
      
      // Add material, dimensions, weight for other categories
      if (item.material) {
        itemDetails += `\n  Material: ${item.material}`;
      }
      if (item.dimensions) {
        itemDetails += `\n  Dimensi: ${item.dimensions}`;
      }
      if (item.weight) {
        itemDetails += `\n  Berat: ${item.weight}kg`;
      }
      
      // Add description if exists
      if (item.description) {
        itemDetails += `\n  Deskripsi: ${item.description}`;
      }
      
      // Add notes if exists
      if (item.notes) {
        itemDetails += `\n  ⚠ Catatan: ${item.notes}`;
      }

      return [
        (idx + 1).toString(),
        `INV-${String(idx + 1).padStart(3, '0')}`,
        itemDetails,
        `${item.quantity} ${item.unit || "pcs"}`,
        '', // Kolom kosong untuk catatan panitia
      ];
    });

    autoTable(doc, {
      startY: infoY + 2 * boxHeight + 2 * gap + 10,
      head: [["No", "Kode", "Nama Barang & Detail", "Jumlah", "Catatan Panitia"]],
      body: tableData,
      styles: { 
        fontSize: 9,
        font: 'helvetica',
        cellPadding: { top: 2.5, right: 1.5, bottom: 2.5, left: 1.5 },
        textColor: [51, 51, 51],
        lineColor: [221, 221, 221],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [51, 51, 51],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'left',
        cellPadding: { top: 2.5, right: 1.5, bottom: 2.5, left: 1.5 }
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' }, // No
        1: { cellWidth: 20 }, // Kode
        2: { cellWidth: 85 }, // Nama Barang & Detail (wider)
        3: { cellWidth: 22, halign: 'center' }, // Jumlah
        4: { cellWidth: 33 } // Catatan Panitia (kolom kosong)
      }
    });

    // === FOOTER - SIGNATURE BOXES ===
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const signBoxWidth = 55;
    const signBoxGap = ((pageWidth - 40) - (3 * signBoxWidth)) / 2;
    
    const signatures = [
      { label: 'Dibuat Oleh,', x: 20 },
      { label: 'Diperiksa Oleh,', x: 20 + signBoxWidth + signBoxGap },
      { label: 'Disetujui Oleh,', x: 20 + 2 * (signBoxWidth + signBoxGap) }
    ];
    
    signatures.forEach(sig => {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const labelWidth = doc.getTextWidth(sig.label);
      doc.text(sig.label, sig.x + (signBoxWidth - labelWidth) / 2, finalY);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const nameText = '( _____________ )';
      const nameWidth = doc.getTextWidth(nameText);
      
      const lineY = finalY + 21;
      const lineStartX = sig.x + (signBoxWidth - 40) / 2;
      doc.setLineWidth(0.3);
      doc.line(lineStartX, lineY, lineStartX + 40, lineY);
      
      doc.text(nameText, sig.x + (signBoxWidth - nameWidth) / 2, lineY + 4);
    });

    // === LABELS PAGE ===
    if (items.length > 0) {
      doc.addPage();
      
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      const labelTitle = 'LABEL INVENTARIS';
      const labelTitleWidth = doc.getTextWidth(labelTitle);
      doc.text(labelTitle, (pageWidth - labelTitleWidth) / 2, 30);
      
      doc.setDrawColor(51, 51, 51);
      doc.setLineWidth(0.8);
      doc.line(20, 38, pageWidth - 20, 38);
      
      let yPos = 50;
      const labelHeight = 45;
      const labelWidth = pageWidth - 40;
      const margin = 20;
      
      items.forEach((item, index) => {
        if (yPos + labelHeight > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFillColor(249, 249, 249);
        doc.rect(margin, yPos, labelWidth, labelHeight, 'F');
        
        doc.setFillColor(51, 51, 51);
        doc.rect(margin, yPos, 1, labelHeight, 'F');
        
        doc.setDrawColor(51, 51, 51);
        doc.setLineWidth(0.3);
        doc.rect(margin, yPos, labelWidth, labelHeight, 'S');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const code = `INV-${String(index + 1).padStart(3, '0')}`;
        doc.text(code, pageWidth - margin - 5, yPos + 7, { align: 'right' });
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${item.name}`, margin + 8, yPos + 12);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Kategori: ${getCategoryLabel(item.category)}`, margin + 8, yPos + 22);
        doc.text(`Jumlah: ${item.quantity} ${item.unit || "pcs"}`, margin + 8, yPos + 29);
        doc.text(`Kondisi: ${item.condition || "Baik"}`, margin + 8, yPos + 36);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(102, 102, 102);
        doc.text(`Tim: ${team.name || "Tim"}`, pageWidth - margin - 5, yPos + labelHeight - 3, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        
        yPos += labelHeight + 10;
      });
    }

    doc.save(`Inventaris_${team.name || 'Tim'}.pdf`);
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
      <PageBreadcrumb pageTitle="Inventaris Barang" />

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
                className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
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
              className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isSubmitting ? "Submitting..." : "Submit Inventaris"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
