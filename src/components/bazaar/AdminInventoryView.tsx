"use client";

import React, { useEffect, useState } from "react";
import { getAllInventories } from "@/actions/inventory";
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

interface Team {
  id: string;
  name: string | null;
  leaderName: string | null;
  boothLocationId: string | null;
  inventoryItems: InventoryItem[];
  inventorySubmission: {
    submittedAt: Date;
    updatedAt: Date;
  } | null;
  user: {
    email: string;
    name: string | null;
  };
}

export default function AdminInventoryView() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadInventories();
  }, []);

  const loadInventories = async () => {
    setLoading(true);
    const result = await getAllInventories();
    if (result.success && result.teams) {
      setTeams(result.teams);
    }
    setLoading(false);
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

  const downloadPDF = async (team: Team) => {
    const doc = new jsPDF();
    doc.setFont('helvetica');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // === HEADER DENGAN LOGO ===
    // Load logo from URL
    try {
      const logoUrl = 'https://ppsntr.nichdant.com/files/resources--inventaris.png';
      const response = await fetch(logoUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      await new Promise((resolve) => {
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // Add logo centered - width 50mm, height auto (maintain aspect ratio)
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
    const boxWidth = (pageWidth - 50) / 2; // 2 kolom dengan gap
    const gap = 10;
    const col1X = 20;
    const col2X = col1X + boxWidth + gap;
    
    // Helper function untuk info box
    const drawInfoBox = (x: number, y: number, label: string, value: string) => {
      // Background #f9f9f9
      doc.setFillColor(249, 249, 249);
      doc.rect(x, y, boxWidth, boxHeight, 'F');
      
      // Border left 4px solid #333
      doc.setDrawColor(51, 51, 51);
      doc.setFillColor(51, 51, 51);
      doc.rect(x, y, 1, boxHeight, 'F');
      
      // Label - 12px bold, color #555
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(85, 85, 85);
      doc.text(label, x + 4, y + 6);
      
      // Value - 14px, color #333
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 51, 51);
      doc.text(value, x + 4, y + 12);
      doc.setTextColor(0, 0, 0);
    };
    
    // Row 1
    drawInfoBox(col1X, infoY, 'Nama Tim:', team.name || '-');
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    drawInfoBox(col2X, infoY, 'Tanggal Cetak:', dateStr);
    
    // Row 2
    drawInfoBox(col1X, infoY + boxHeight + gap, 'Penanggung Jawab:', team.leaderName || '-');
    drawInfoBox(col2X, infoY + boxHeight + gap, 'Total Item:', `${team.inventoryItems.length} Item`);

    // === TABLE (matching print.html structure) ===
    const tableData = team.inventoryItems.map((item, idx) => {
      const specs = [];
      if (item.category === "ELEKTRONIK") {
        if (item.watt) specs.push(`${item.watt}W`);
        if (item.ampere) specs.push(`${item.ampere}A`);
        if (item.voltage) specs.push(`${item.voltage}V`);
        if (item.brand) specs.push(item.brand);
      } else if (item.material) {
        specs.push(item.material);
      }
      if (item.dimensions) specs.push(item.dimensions);

      return [
        (idx + 1).toString(),
        `INV-${String(idx + 1).padStart(3, '0')}`,
        item.name,
        getCategoryLabel(item.category),
        `${item.quantity} ${item.unit || "pcs"}`,
        item.condition || "Baik",
        specs.join(", ") || "-",
      ];
    });

    autoTable(doc, {
      startY: infoY + 2 * boxHeight + 2 * gap + 10,
      head: [["No", "Kode", "Nama Barang", "Kategori", "Jumlah", "Kondisi", "Lokasi"]],
      body: tableData,
      styles: { 
          fontSize: 10, // smaller untuk fit
          font: 'helvetica',
          cellPadding: { top: 2, right: 1.5, bottom: 2, left: 1.5 },
          textColor: [51, 51, 51],
          lineColor: [221, 221, 221],
          lineWidth: 0.1
        },
        headStyles: { 
          fillColor: [51, 51, 51], // #333
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
          halign: 'left',
          cellPadding: { top: 2.5, right: 1.5, bottom: 2.5, left: 1.5 }
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250] // #fafafa
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' }, // No
          1: { cellWidth: 20 }, // Kode
          2: { cellWidth: 50 }, // Nama - reduced
          3: { cellWidth: 25 }, // Kategori
          4: { cellWidth: 18, halign: 'center' }, // Jumlah
          5: { cellWidth: 20 }, // Kondisi
          6: { cellWidth: 27 } // Lokasi
        }
      });

    // === FOOTER - SIGNATURE BOXES (3 columns) ===
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const signBoxWidth = 55;
    const signBoxGap = ((pageWidth - 40) - (3 * signBoxWidth)) / 2;
    
    const signatures = [
      { label: 'Dibuat Oleh,', x: 20 },
      { label: 'Diperiksa Oleh,', x: 20 + signBoxWidth + signBoxGap },
      { label: 'Disetujui Oleh,', x: 20 + 2 * (signBoxWidth + signBoxGap) }
    ];
    
    signatures.forEach(sig => {
      // Title - 12px bold, centered
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const labelWidth = doc.getTextWidth(sig.label);
      doc.text(sig.label, sig.x + (signBoxWidth - labelWidth) / 2, finalY);
      
      // Empty space for signature (60px in CSS = ~21mm)
      // Name with border-top - 12px
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const nameText = '( _____________ )';
      const nameWidth = doc.getTextWidth(nameText);
      
      // Border top line
      const lineY = finalY + 21;
      const lineStartX = sig.x + (signBoxWidth - 40) / 2;
      doc.setLineWidth(0.3);
      doc.line(lineStartX, lineY, lineStartX + 40, lineY);
      
      // Name text below line
      doc.text(nameText, sig.x + (signBoxWidth - nameWidth) / 2, lineY + 4);
    });

    // === LABELS PAGE (same style) ===
    if (team.inventoryItems.length > 0) {
      doc.addPage();
      
      // Header for labels
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
      
      team.inventoryItems.forEach((item, index) => {
        if (yPos + labelHeight > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          yPos = 20;
        }
        
        // Background
        doc.setFillColor(249, 249, 249);
        doc.rect(margin, yPos, labelWidth, labelHeight, 'F');
        
        // Border left 4px
        doc.setFillColor(51, 51, 51);
        doc.rect(margin, yPos, 1, labelHeight, 'F');
        
        // Outer border
        doc.setDrawColor(51, 51, 51);
        doc.setLineWidth(0.3);
        doc.rect(margin, yPos, labelWidth, labelHeight, 'S');
        
        // Item code (top right)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const code = `INV-${String(index + 1).padStart(3, '0')}`;
        doc.text(code, pageWidth - margin - 5, yPos + 7, { align: 'right' });
        
        // Item number and name
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${item.name}`, margin + 8, yPos + 12);
        
        // Category and quantity
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Kategori: ${getCategoryLabel(item.category)}`, margin + 8, yPos + 22);
        doc.text(`Jumlah: ${item.quantity} ${item.unit || "pcs"}`, margin + 8, yPos + 29);
        doc.text(`Kondisi: ${item.condition || "Baik"}`, margin + 8, yPos + 36);
        
        // Team name (bottom right, smaller)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(102, 102, 102);
        doc.text(`Tim: ${team.name || "Tim"}`, pageWidth - margin - 5, yPos + labelHeight - 3, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        
        yPos += labelHeight + 10;
      });
    }

    doc.save(`Inventaris_${team.name || team.id}.pdf`);
  };

  const downloadAllPDF = async () => {
    const doc = new jsPDF();
    doc.setFont('helvetica');
    const pageWidth = doc.internal.pageSize.getWidth();
    let allItems: Array<{item: InventoryItem, teamName: string, itemIndex: number}> = [];
    let globalIndex = 0;
    
    // Load logo once
    let logoData = '';
    try {
      const logoUrl = 'https://ppsntr.nichdant.com/files/resources--inventaris.png';
      const response = await fetch(logoUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      logoData = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to load logo:', error);
    }

    teams.forEach((team, teamIndex) => {
      if (teamIndex > 0) {
        doc.addPage();
      }
      
      // === HEADER DENGAN LOGO ===
      if (logoData) {
        const logoWidth = 50;
        doc.addImage(logoData, 'PNG', (pageWidth - logoWidth) / 2, 8, logoWidth, 0);
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
      const now = new Date();
      
      // Helper function untuk info box
      const drawInfoBox = (x: number, y: number, label: string, value: string) => {
        // Background #f9f9f9
        doc.setFillColor(249, 249, 249);
        doc.rect(x, y, boxWidth, boxHeight, 'F');
        
        // Border left 4px solid #333
        doc.setDrawColor(51, 51, 51);
        doc.setFillColor(51, 51, 51);
        doc.rect(x, y, 1, boxHeight, 'F');
        
        // Label - 12px bold, color #555
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(85, 85, 85);
        doc.text(label, x + 4, y + 6);
        
        // Value - 14px, color #333
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 51, 51);
        doc.text(value, x + 4, y + 12);
        doc.setTextColor(0, 0, 0);
      };
      
      // Row 1
      drawInfoBox(col1X, infoY, 'Nama Tim:', team.name || '-');
      const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
      drawInfoBox(col2X, infoY, 'Tanggal Cetak:', dateStr);
      
      // Row 2
      drawInfoBox(col1X, infoY + boxHeight + gap, 'Penanggung Jawab:', team.leaderName || '-');
      drawInfoBox(col2X, infoY + boxHeight + gap, 'Total Item:', `${team.inventoryItems.length} Item`);

      // === TABLE (matching print.html structure) ===
      const tableData = team.inventoryItems.map((item, idx) => {
        allItems.push({ item, teamName: team.name || "Tim", itemIndex: globalIndex });
        globalIndex++;
        
        const specs = [];
        if (item.category === "ELEKTRONIK") {
          if (item.watt) specs.push(`${item.watt}W`);
          if (item.ampere) specs.push(`${item.ampere}A`);
          if (item.voltage) specs.push(`${item.voltage}V`);
          if (item.brand) specs.push(item.brand);
        } else if (item.material) {
          specs.push(item.material);
        }
        if (item.dimensions) specs.push(item.dimensions);

        return [
          (idx + 1).toString(),
          `INV-${String(globalIndex).padStart(3, '0')}`,
          item.name,
          getCategoryLabel(item.category),
          `${item.quantity} ${item.unit || "pcs"}`,
          item.condition || "Baik",
          specs.join(", ") || "-",
        ];
      });

      autoTable(doc, {
        startY: infoY + 2 * boxHeight + 2 * gap + 10,
        head: [["No", "Kode", "Nama Barang", "Kategori", "Jumlah", "Kondisi", "Lokasi"]],
        body: tableData,
        styles: { 
          fontSize: 10,
          font: 'helvetica',
          cellPadding: { top: 2, right: 1.5, bottom: 2, left: 1.5 },
          textColor: [51, 51, 51],
          lineColor: [221, 221, 221],
          lineWidth: 0.1
        },
        headStyles: { 
          fillColor: [51, 51, 51], // #333
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
          halign: 'left',
          cellPadding: { top: 2.5, right: 1.5, bottom: 2.5, left: 1.5 }
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250] // #fafafa
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 20 },
          2: { cellWidth: 50 },
          3: { cellWidth: 25 },
          4: { cellWidth: 18, halign: 'center' },
          5: { cellWidth: 20 },
          6: { cellWidth: 27 }
        }
      });
      
      // === FOOTER - SIGNATURE BOXES (3 columns) ===
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      const signBoxWidth = 55;
      const signBoxGap = ((pageWidth - 40) - (3 * signBoxWidth)) / 2;
      
      const signatures = [
        { label: 'Dibuat Oleh,', x: 20 },
        { label: 'Diperiksa Oleh,', x: 20 + signBoxWidth + signBoxGap },
        { label: 'Disetujui Oleh,', x: 20 + 2 * (signBoxWidth + signBoxGap) }
      ];
      
      signatures.forEach(sig => {
        // Title - 12px bold, centered
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        const labelWidth = doc.getTextWidth(sig.label);
        doc.text(sig.label, sig.x + (signBoxWidth - labelWidth) / 2, finalY);
        
        // Empty space for signature (60px in CSS = ~21mm)
        // Name with border-top - 12px
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const nameText = '( _____________ )';
        const nameWidth = doc.getTextWidth(nameText);
        
        // Border top line
        const lineY = finalY + 21;
        const lineStartX = sig.x + (signBoxWidth - 40) / 2;
        doc.setLineWidth(0.3);
        doc.line(lineStartX, lineY, lineStartX + 40, lineY);
        
        // Name text below line
        doc.text(nameText, sig.x + (signBoxWidth - nameWidth) / 2, lineY + 4);
      });
    });

    // === LABELS PAGE (same style) ===
    if (allItems.length > 0) {
      doc.addPage();
      
      // Header for labels
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
      
      allItems.forEach((entry) => {
        if (yPos + labelHeight > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          yPos = 20;
        }
        
        // Background
        doc.setFillColor(249, 249, 249);
        doc.rect(margin, yPos, labelWidth, labelHeight, 'F');
        
        // Border left 4px
        doc.setFillColor(51, 51, 51);
        doc.rect(margin, yPos, 1, labelHeight, 'F');
        
        // Outer border
        doc.setDrawColor(51, 51, 51);
        doc.setLineWidth(0.3);
        doc.rect(margin, yPos, labelWidth, labelHeight, 'S');
        
        // Item code (top right)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const code = `INV-${String(entry.itemIndex + 1).padStart(3, '0')}`;
        doc.text(code, pageWidth - margin - 5, yPos + 7, { align: 'right' });
        
        // Item name
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(entry.item.name, margin + 8, yPos + 12);
        
        // Category and quantity
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Kategori: ${getCategoryLabel(entry.item.category)}`, margin + 8, yPos + 22);
        doc.text(`Jumlah: ${entry.item.quantity} ${entry.item.unit || "pcs"}`, margin + 8, yPos + 29);
        doc.text(`Kondisi: ${entry.item.condition || "Baik"}`, margin + 8, yPos + 36);
        
        // Team name (bottom right, smaller)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(102, 102, 102);
        doc.text(`Tim: ${entry.teamName}`, pageWidth - margin - 5, yPos + labelHeight - 3, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        
        yPos += labelHeight + 10;
      });
    }

    doc.save("Inventaris_Semua_Tim.pdf");
  };

  const filteredTeams = teams.filter((team) => {
    const query = searchQuery.toLowerCase();
    return (
      team.name?.toLowerCase().includes(query) ||
      team.leaderName?.toLowerCase().includes(query) ||
      team.user.email.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg text-gray-500 dark:text-gray-400">Memuat data...</div>
      </div>
    );
  }

  if (selectedTeam) {
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedTeam(null)}
        />
        
        {/* Modal */}
        <div className="fixed inset-4 z-50 overflow-auto md:inset-8 lg:inset-16">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-lg border border-stroke bg-white shadow-2xl dark:border-dark-3 dark:bg-gray-dark">
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stroke bg-white px-6 py-4 dark:border-dark-3 dark:bg-gray-dark">
                <h2 className="text-2xl font-bold text-dark dark:text-white">
                  {selectedTeam.name || "Tim"}
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => downloadPDF(selectedTeam)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    📄 Download PDF
                  </button>
                  <button
                    onClick={() => setSelectedTeam(null)}
                    className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium transition hover:bg-gray-50 dark:border-dark-3 dark:hover:bg-dark-3"
                  >
                    ✕ Tutup
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark-2">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Ketua Tim</p>
                    <p className="mt-1 text-base font-semibold text-dark dark:text-white">
                      {selectedTeam.leaderName || "-"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark-2">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</p>
                    <p className="mt-1 text-base font-semibold text-dark dark:text-white">
                      {selectedTeam.user.email}
                    </p>
                  </div>
                  {selectedTeam.boothLocationId && (
                    <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark-2">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Lokasi Booth</p>
                      <p className="mt-1 text-base font-semibold text-dark dark:text-white">
                        {selectedTeam.boothLocationId}
                      </p>
                    </div>
                  )}
                  {selectedTeam.inventorySubmission && (
                    <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark-2">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Terakhir Update</p>
                      <p className="mt-1 text-sm font-semibold text-dark dark:text-white">
                        {new Date(selectedTeam.inventorySubmission.updatedAt).toLocaleString("id-ID")}
                      </p>
                    </div>
                  )}
                </div>

                <h3 className="mb-4 text-xl font-semibold text-dark dark:text-white">
                  Daftar Item ({selectedTeam.inventoryItems.length})
                </h3>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedTeam.inventoryItems.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark-2"
              >
                <h4 className="mb-2 text-lg font-semibold text-dark dark:text-white">
                  {item.name}
                </h4>
                <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {getCategoryLabel(item.category)}
                </span>
                <div className="mt-3 space-y-1 text-sm text-dark dark:text-white">
                  <p>
                    <span className="font-medium">Jumlah:</span> {item.quantity}{" "}
                    {item.unit || "pcs"}
                  </p>
                  {item.condition && (
                    <p>
                      <span className="font-medium">Kondisi:</span> {item.condition}
                    </p>
                  )}
                  {item.category === "ELEKTRONIK" && (
                    <>
                      {item.watt && <p>Watt: {item.watt}W</p>}
                      {item.ampere && <p>Ampere: {item.ampere}A</p>}
                      {item.voltage && <p>Voltage: {item.voltage}V</p>}
                      {item.brand && <p>Brand: {item.brand}</p>}
                    </>
                  )}
                  {item.material && <p>Material: {item.material}</p>}
                  {item.dimensions && <p>Dimensi: {item.dimensions}</p>}
                  {item.weight && <p>Berat: {item.weight}kg</p>}
                  {item.description && (
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      {item.description}
                    </p>
                  )}
                  {item.notes && (
                    <p className="mt-2 rounded bg-yellow-100 p-2 text-xs dark:bg-yellow-900/20">
                      <span className="font-medium">Catatan:</span> {item.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
  </>
  );
}

return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark dark:text-white">
            Inventaris Tim ({teams.length})
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Daftar tim yang sudah submit inventaris
          </p>
        </div>
        <button
          onClick={downloadAllPDF}
          disabled={teams.length === 0}
          className="rounded-lg bg-green-600 px-6 py-2 text-white transition hover:bg-green-700 disabled:opacity-50"
        >
          Download Semua PDF
        </button>
      </div>

      <div className="rounded-lg border border-stroke bg-white p-4 dark:border-dark-3 dark:bg-gray-dark">
        <input
          type="text"
          placeholder="Cari nama tim, ketua, atau email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
        />
      </div>

      {filteredTeams.length === 0 ? (
        <div className="rounded-lg border border-stroke bg-white p-8 text-center dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? "Tidak ada hasil yang cocok" : "Belum ada tim yang submit inventaris"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              className="rounded-lg border border-stroke bg-white p-5 shadow-sm transition hover:shadow-md dark:border-dark-3 dark:bg-gray-dark"
            >
              <h3 className="mb-3 text-lg font-bold text-dark dark:text-white">
                {team.name || "Tim"}
              </h3>
              <div className="mb-4 space-y-1 text-sm">
                <p className="text-gray-600 dark:text-gray-400">
                  Ketua: {team.leaderName || "-"}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Email: {team.user.email}</p>
                <p className="font-medium text-primary">
                  {team.inventoryItems.length} item inventaris
                </p>
                {team.inventorySubmission && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Update:{" "}
                    {new Date(team.inventorySubmission.updatedAt).toLocaleDateString("id-ID")}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedTeam(team)}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  👁️ Lihat Detail
                </button>
                <button
                  onClick={() => downloadPDF(team)}
                  className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
                >
                  📄 PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
