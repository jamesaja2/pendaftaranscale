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

  const downloadPDF = (team: Team) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Daftar Inventaris Bazaar", 14, 20);

    // Team Info
    doc.setFontSize(12);
    doc.text(`Nama Tim: ${team.name || "-"}`, 14, 30);
    doc.text(`Ketua: ${team.leaderName || "-"}`, 14, 37);
    doc.text(`Email: ${team.user.email}`, 14, 44);
    if (team.boothLocationId) {
      doc.text(`Lokasi Booth: ${team.boothLocationId}`, 14, 51);
    }

    // Table
    const tableData = team.inventoryItems.map((item) => {
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
      startY: 58,
      head: [["Nama Barang", "Kategori", "Jumlah", "Kondisi", "Spesifikasi", "Catatan"]],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`Inventaris_${team.name || team.id}.pdf`);
  };

  const downloadAllPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Daftar Inventaris Semua Tim", 14, 20);

    let startY = 30;

    teams.forEach((team, teamIndex) => {
      if (teamIndex > 0) {
        doc.addPage();
        startY = 20;
      }

      doc.setFontSize(14);
      doc.text(`${teamIndex + 1}. ${team.name || "Tim " + (teamIndex + 1)}`, 14, startY);
      startY += 7;

      doc.setFontSize(10);
      doc.text(`Ketua: ${team.leaderName || "-"}`, 14, startY);
      startY += 5;
      doc.text(`Email: ${team.user.email}`, 14, startY);
      startY += 5;
      if (team.boothLocationId) {
        doc.text(`Lokasi: ${team.boothLocationId}`, 14, startY);
        startY += 5;
      }
      startY += 3;

      const tableData = team.inventoryItems.map((item) => {
        const details = [];
        if (item.category === "ELEKTRONIK") {
          if (item.watt) details.push(`${item.watt}W`);
          if (item.ampere) details.push(`${item.ampere}A`);
          if (item.brand) details.push(item.brand);
        }
        if (item.dimensions) details.push(item.dimensions);

        return [
          item.name,
          getCategoryLabel(item.category),
          `${item.quantity} ${item.unit || "pcs"}`,
          details.join(", ") || "-",
        ];
      });

      autoTable(doc, {
        startY: startY,
        head: [["Nama Barang", "Kategori", "Jumlah", "Spesifikasi"]],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });
    });

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
                <span className="font-medium">Lokasi Booth:</span>{" "}
                {selectedTeam.boothLocationId}
              </p>
            )}
            {selectedTeam.inventorySubmission && (
              <p className="text-dark dark:text-white">
                <span className="font-medium">Terakhir Update:</span>{" "}
                {new Date(selectedTeam.inventorySubmission.updatedAt).toLocaleString("id-ID")}
              </p>
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
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm text-white transition hover:bg-primary/90"
                >
                  Lihat Detail
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
