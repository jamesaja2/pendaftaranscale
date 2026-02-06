"use client";

import React, { useEffect, useState } from "react";
import { getAllProducts } from "@/actions/product";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  stock?: number | null;
  isAvailable: boolean;
  category?: string | null;
  variants?: Array<{
    id: string;
    name: string;
    additionalPrice: number;
    isRequired: boolean;
    isAvailable: boolean;
    order: number;
  }>;
  addons?: Array<{
    id: string;
    name: string;
    price: number;
    isAvailable: boolean;
    order: number;
  }>;
}

interface Team {
  id: string;
  name: string | null;
  leaderName: string | null;
  boothLocationId: string | null;
  products: Product[];
  productSubmission: {
    submittedAt: Date;
    updatedAt: Date;
  } | null;
  user: {
    email: string;
    name: string | null;
  };
}

export default function AdminProductView() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const result = await getAllProducts();
    if (result.success && result.teams) {
      setTeams(result.teams as any);
    }
    setLoading(false);
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
    const titleText = 'KATALOG PRODUK';
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
    drawInfoBox(col2X, infoY + boxHeight + gap, 'Total Produk:', `${team.products.length} Produk`);

    // === TABLE (matching print.html structure) ===
    const tableData = team.products.map((product, idx) => {
      const variantCount = (product as any).variants?.length || 0;
      const addonCount = (product as any).addons?.length || 0;
      const variantText = variantCount > 0 ? `${variantCount} varian` : "-";
      const addonText = addonCount > 0 ? `${addonCount} add-on` : "-";
      const priceText = `Rp ${(product as any).price?.toLocaleString('id-ID') || 0}`;
      
      return [
        (idx + 1).toString(),
        `PRD-${String(idx + 1).padStart(3, '0')}`,
        product.name,
        priceText,
        variantText,
        addonText,
        product.stock !== null && product.stock !== undefined ? product.stock.toString() : "Unlimited",
      ];
    });

    autoTable(doc, {
      startY: infoY + 2 * boxHeight + 2 * gap + 10,
      head: [["No", "Kode", "Nama Produk", "Harga", "Varian", "Add-on", "Stok"]],
      body: tableData,
      styles: { 
        fontSize: 9, // smaller untuk fit
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
        fontSize: 9,
        halign: 'left',
        cellPadding: { top: 2.5, right: 1.5, bottom: 2.5, left: 1.5 }
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250] // #fafafa
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' }, // No
        1: { cellWidth: 22 }, // Kode
        2: { cellWidth: 40 }, // Nama Produk
        3: { cellWidth: 28, halign: 'right' }, // Harga
        4: { cellWidth: 22, halign: 'center' }, // Varian
        5: { cellWidth: 22, halign: 'center' }, // Add-on
        6: { cellWidth: 18, halign: 'center' } // Stok
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
    if (team.products.length > 0) {
      doc.addPage();
      
      // Header for labels
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      const labelTitle = 'LABEL PRODUK';
      const labelTitleWidth = doc.getTextWidth(labelTitle);
      doc.text(labelTitle, (pageWidth - labelTitleWidth) / 2, 30);
      
      doc.setDrawColor(51, 51, 51);
      doc.setLineWidth(0.8);
      doc.line(20, 38, pageWidth - 20, 38);
      
      let yPos = 50;
      const labelHeight = 45;
      const labelWidth = pageWidth - 40;
      const margin = 20;
      
      team.products.forEach((product, index) => {
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
        
        // Product code (top right)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const code = `PRD-${String(index + 1).padStart(3, '0')}`;
        doc.text(code, pageWidth - margin - 5, yPos + 7, { align: 'right' });
        
        // Product number and name
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${product.name}`, margin + 8, yPos + 12);
        
        // Price, variant count, addon count, and stock
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const priceText = `Harga: Rp ${((product as any).price || 0).toLocaleString('id-ID')}`;
        doc.text(priceText, margin + 8, yPos + 22);
        
        const variantCount = (product as any).variants?.length || 0;
        const addonCount = (product as any).addons?.length || 0;
        const variantText = variantCount > 0 ? `${variantCount} varian` : 'Tanpa varian';
        const addonText = addonCount > 0 ? `${addonCount} add-on` : 'Tanpa add-on';
        doc.text(`${variantText}, ${addonText}`, margin + 8, yPos + 29);
        
        const stockText = product.stock !== null && product.stock !== undefined 
          ? `Stok: ${product.stock}` 
          : 'Stok: Unlimited';
        doc.text(stockText, margin + 8, yPos + 36);
        
        // Team name (bottom right, smaller)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(102, 102, 102);
        doc.text(`Tim: ${team.name || "Tim"}`, pageWidth - margin - 5, yPos + labelHeight - 3, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        
        yPos += labelHeight + 10;
      });
    }

    doc.save(`Katalog_Produk_${team.name || team.id}.pdf`);
  };

  const downloadAllPDF = async () => {
    const doc = new jsPDF();
    doc.setFont('helvetica');
    const pageWidth = doc.internal.pageSize.getWidth();
    let allProducts: Array<{product: Product, teamName: string, productIndex: number}> = [];
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
      const titleText = 'KATALOG PRODUK';
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
      drawInfoBox(col2X, infoY + boxHeight + gap, 'Total Produk:', `${team.products.length} Produk`);

      // === TABLE (matching print.html structure) ===
      const tableData = team.products.map((product, idx) => {
        allProducts.push({ product, teamName: team.name || "Tim", productIndex: globalIndex });
        globalIndex++;
        
        const variantCount = (product as any).variants?.length || 0;
        const addonCount = (product as any).addons?.length || 0;
        const variantText = variantCount > 0 ? `${variantCount} varian` : "-";
        const addonText = addonCount > 0 ? `${addonCount} add-on` : "-";
        const priceText = `Rp ${((product as any).price || 0).toLocaleString('id-ID')}`;
        
        return [
          (idx + 1).toString(),
          `PRD-${String(globalIndex).padStart(3, '0')}`,
          product.name,
          priceText,
          variantText,
          addonText,
          product.stock !== null && product.stock !== undefined ? product.stock.toString() : "Unlimited",
        ];
      });

      autoTable(doc, {
        startY: infoY + 2 * boxHeight + 2 * gap + 10,
        head: [["No", "Kode", "Nama Produk", "Harga", "Varian", "Add-on", "Stok"]],
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
          0: { cellWidth: 10, halign: 'center' }, // No
          1: { cellWidth: 22 }, // Kode
          2: { cellWidth: 50 }, // Nama Produk
          3: { cellWidth: 28, halign: 'right' }, // Harga
          4: { cellWidth: 22, halign: 'center' }, // Varian
          5: { cellWidth: 22, halign: 'center' }, // Add-on
          6: { cellWidth: 18, halign: 'center' } // Stok
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
    if (allProducts.length > 0) {
      doc.addPage();
      
      // Header for labels
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      const labelTitle = 'LABEL PRODUK';
      const labelTitleWidth = doc.getTextWidth(labelTitle);
      doc.text(labelTitle, (pageWidth - labelTitleWidth) / 2, 30);
      
      doc.setDrawColor(51, 51, 51);
      doc.setLineWidth(0.8);
      doc.line(20, 38, pageWidth - 20, 38);
      
      let yPos = 50;
      const labelHeight = 45;
      const labelWidth = pageWidth - 40;
      const margin = 20;
      
      allProducts.forEach((entry) => {
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
        
        // Product code (top right)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const code = `PRD-${String(entry.productIndex + 1).padStart(3, '0')}`;
        doc.text(code, pageWidth - margin - 5, yPos + 7, { align: 'right' });
        
        // Product name
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(entry.product.name, margin + 8, yPos + 12);
        
        // Price, variant count, addon count, and stock
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const priceText = `Harga: Rp ${((entry.product as any).price || 0).toLocaleString('id-ID')}`;
        doc.text(priceText, margin + 8, yPos + 22);
        
        const variantCount = (entry.product as any).variants?.length || 0;
        const addonCount = (entry.product as any).addons?.length || 0;
        const variantText = variantCount > 0 ? `${variantCount} varian` : 'Tanpa varian';
        const addonText = addonCount > 0 ? `${addonCount} add-on` : 'Tanpa add-on';
        doc.text(`${variantText}, ${addonText}`, margin + 8, yPos + 29);
        
        const stockText = entry.product.stock !== null && entry.product.stock !== undefined 
          ? `Stok: ${entry.product.stock}` 
          : 'Stok: Unlimited';
        doc.text(stockText, margin + 8, yPos + 36);
        
        // Team name (bottom right, smaller)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(102, 102, 102);
        doc.text(`Tim: ${entry.teamName}`, pageWidth - margin - 5, yPos + labelHeight - 3, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        
        yPos += labelHeight + 10;
      });
    }

    doc.save("Katalog_Produk_Semua_Tim.pdf");
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedTeam(null)}
            className="rounded-lg border border-stroke px-4 py-2 transition hover:bg-gray-50 dark:border-dark-3 dark:hover:bg-dark-3"
          >
            ← Kembali
          </button>
          <button
            onClick={() => downloadPDF(selectedTeam)}
            className="rounded-lg bg-blue-500 px-6 py-2 text-white transition hover:bg-blue-600"
          >
            Download PDF
          </button>
        </div>

        <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
          <h2 className="mb-4 text-2xl font-bold text-dark dark:text-white">
            {selectedTeam.name || "Tim"}
          </h2>
          <div className="mb-6 space-y-2 text-sm">
            <p className="text-dark dark:text-white">
              <span className="font-medium">Ketua:</span> {selectedTeam.leaderName || "-"}
            </p>
            <p className="text-dark dark:text-white">
              <span className="font-medium">Email:</span> {selectedTeam.user.email}
            </p>
            {selectedTeam.boothLocationId && (
              <p className="text-dark dark:text-white">
                <span className="font-medium">Lokasi Booth:</span> {selectedTeam.boothLocationId}
              </p>
            )}
            {selectedTeam.productSubmission && (
              <p className="text-dark dark:text-white">
                <span className="font-medium">Terakhir Update:</span>{" "}
                {new Date(selectedTeam.productSubmission.updatedAt).toLocaleString("id-ID")}
              </p>
            )}
          </div>

          <h3 className="mb-4 text-xl font-semibold text-dark dark:text-white">
            Daftar Produk ({selectedTeam.products.length})
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selectedTeam.products.map((product) => (
              <div
                key={product.id}
                className="rounded-lg border border-stroke bg-gray-50 dark:border-dark-3 dark:bg-dark-2"
              >
                {product.imageUrl ? (
                  <div className="relative h-40 w-full overflow-hidden rounded-t-lg">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-t-lg bg-gray-200 dark:bg-dark-3">
                    <svg
                      className="h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
                <div className="p-4">
                  <h4 className="mb-2 text-lg font-semibold text-dark dark:text-white">
                    {product.name}
                  </h4>
                  
                  {/* Price */}
                  <p className="mb-2 text-xl font-bold text-primary">
                    Rp {((product as any).price || 0).toLocaleString('id-ID')}
                  </p>
                  
                  {/* Category */}
                  {(product as any).category && (
                    <span className="mb-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                      {(product as any).category}
                    </span>
                  )}
                  
                  {/* Variants and Addons count */}
                  <div className="mb-2 flex gap-2">
                    {(product as any).variants && (product as any).variants.length > 0 && (
                      <span className="inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600 dark:bg-green-900/20 dark:text-green-400">
                        {(product as any).variants.length} varian
                      </span>
                    )}
                    {(product as any).addons && (product as any).addons.length > 0 && (
                      <span className="inline-block rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                        {(product as any).addons.length} add-on
                      </span>
                    )}
                  </div>
                  
                  {/* Description */}
                  {product.description && (
                    <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                      {product.description}
                    </p>
                  )}
                  
                  {/* Stock and availability */}
                  <div className="flex items-center gap-2">
                    {product.stock !== null && product.stock !== undefined ? (
                      <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                        Stok: {product.stock}
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600 dark:bg-green-900/20 dark:text-green-400">
                        Unlimited
                      </span>
                    )}
                    {!(product as any).isAvailable && (
                      <span className="inline-block rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
                        Tidak Tersedia
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark dark:text-white">
            Katalog Produk Tim ({teams.length})
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Daftar tim yang sudah submit katalog produk
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
            {searchQuery ? "Tidak ada hasil yang cocok" : "Belum ada tim yang submit katalog produk"}
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
                  {team.products.length} produk
                </p>
                {team.productSubmission && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Update: {new Date(team.productSubmission.updatedAt).toLocaleDateString("id-ID")}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedTeam(team)}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm text-white transition hover:bg-primary/90"
                >
                  Lihat Katalog
                </button>
                <button
                  onClick={() => downloadPDF(team)}
                  className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white transition hover:bg-blue-600"
                >
                  PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
