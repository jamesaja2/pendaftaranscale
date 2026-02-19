"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  getPayoutDashboard,
  savePayoutAdminChanges,
} from "@/actions/payout";
import {
  PAYOUT_STATUS_OPTIONS,
  PayoutStatus,
  computePayoutFromRecorded,
  formatIDRCurrency,
} from "@/lib/payoutMath";
import { AdminPayoutRowDTO } from "@/types/payout";

interface AdminRowState extends AdminPayoutRowDTO {
  recordedAmountInput: string;
  adminNotesInput: string;
}

const statusBadgeStyles: Record<PayoutStatus, string> = {
  WAITING_VERIFICATION: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
  PROCESSING: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  TRANSFERRED: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
};

export default function AdminPayoutView() {
  const [rows, setRows] = useState<AdminRowState[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const response = await getPayoutDashboard();
    if (!response.success || !response.data) {
      setError(response.error || "Gagal memuat data" );
      setRows([]);
      setLoading(false);
      return;
    }

    const mapped: AdminRowState[] = response.data.map((row) => ({
      ...row,
      recordedAmountInput:
        typeof row.recordedAmount === "number" && !Number.isNaN(row.recordedAmount)
          ? row.recordedAmount.toString()
          : "",
      adminNotesInput: row.adminNotes || "",
    }));

    setRows(mapped);
    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRows = useMemo(() => {
    if (!searchQuery) return rows;
    const lower = searchQuery.toLowerCase();
    return rows.filter((row) =>
      [row.teamName, row.leaderName, row.contactEmail]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(lower))
    );
  }, [rows, searchQuery]);

  const stats = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        const recordedValue = parseFloat(row.recordedAmountInput || "0") || 0;
        const computed = computePayoutFromRecorded(recordedValue);
        acc.totalRecorded += computed.recordedAmount;
        acc.totalGross += computed.beforeProcessing;
        acc.totalNet += computed.participantTakeHome;
        acc.statusCount[row.status] = (acc.statusCount[row.status] || 0) + 1;
        return acc;
      },
      {
        totalRecorded: 0,
        totalGross: 0,
        totalNet: 0,
        statusCount: {
          WAITING_VERIFICATION: 0,
          PROCESSING: 0,
          TRANSFERRED: 0,
        } as Record<PayoutStatus, number>,
      }
    );
  }, [filteredRows]);

  const handleFieldChange = (
    teamId: string,
    field: keyof AdminRowState,
    value: string | PayoutStatus
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row.teamId === teamId
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  };

  const handleSave = async (teamId: string) => {
    const row = rows.find((item) => item.teamId === teamId);
    if (!row) return;

    const parsedAmount = parseFloat(row.recordedAmountInput || "0");
    if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
      alert("Jumlah saldo tidak valid");
      return;
    }

    setSavingId(teamId);
    const response = await savePayoutAdminChanges({
      teamId,
      recordedAmount: parsedAmount,
      status: row.status,
      adminNotes: row.adminNotesInput,
    });
    setSavingId(null);

    if (!response.success) {
      alert(response.error || "Gagal menyimpan data");
      return;
    }

    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row">
        <StatCard
          title="Total Saldo (setelah 0,7%)"
          value={formatIDRCurrency(stats.totalRecorded)}
          subtitle="Nilai yang diinput admin"
        />
        <StatCard
          title="Estimasi Kotor (sebelum 0,7%)"
          value={formatIDRCurrency(stats.totalGross)}
          subtitle="Digunakan untuk hitung 10%"
        />
        <StatCard
          title="Estimasi Diterima Tim"
          value={formatIDRCurrency(stats.totalNet)}
          subtitle="Setelah potong 10%"
        />
      </div>

      <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-dark dark:text-white">Pengaturan Saldo Tim</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Input saldo setelah potongan 0,7% dan atur status pencairan dana.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              placeholder="Cari nama tim / ketua / email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white sm:w-72"
            />
            <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
              {PAYOUT_STATUS_OPTIONS.map((status) => (
                <span key={status.value}>
                  {status.label}: {stats.statusCount[status.value] || 0}
                </span>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 text-gray-500 dark:text-gray-400">Memuat data...</div>
        ) : error ? (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="mt-6 rounded-lg bg-gray-50 p-6 text-center text-gray-500 dark:bg-dark-2 dark:text-gray-400">
            Tidak ada tim yang cocok dengan pencarian.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredRows.map((row) => {
              const parsedAmount = parseFloat(row.recordedAmountInput || "0") || 0;
              const computed = computePayoutFromRecorded(parsedAmount);
              return (
                <div
                  key={row.teamId}
                  className="rounded-2xl border border-stroke bg-white p-5 shadow-sm transition hover:shadow-lg dark:border-dark-3 dark:bg-gray-dark"
                >
                  <div className="flex flex-col gap-3 border-b border-stroke pb-4 dark:border-dark-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-dark dark:text-white">{row.teamName}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Ketua: {row.leaderName || "-"} • {row.contactEmail}
                      </p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeStyles[row.status]}`}>
                      {PAYOUT_STATUS_OPTIONS.find((item) => item.value === row.status)?.label}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Saldo masuk (sudah -0,7%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={row.recordedAmountInput}
                        onChange={(e) => handleFieldChange(row.teamId, "recordedAmountInput", e.target.value)}
                        className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Nilai asli setelah biaya payment gateway 0,7%
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Status pencairan
                      </label>
                      <select
                        value={row.status}
                        onChange={(e) =>
                          handleFieldChange(row.teamId, "status", e.target.value as PayoutStatus)
                        }
                        className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                      >
                        {PAYOUT_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value} className="text-dark">
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Status akan terlihat oleh peserta.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Rekening BCA peserta
                      </label>
                      {row.bankAccountNumber ? (
                        <div className="rounded-lg border border-dashed border-green-500/60 bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/10 dark:text-green-200">
                          <p className="font-semibold">{row.bankAccountName || "Tanpa Nama"}</p>
                          <p>No. Rek: {row.bankAccountNumber}</p>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-yellow-500/60 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:bg-yellow-900/10 dark:text-yellow-200">
                          Tim belum mengisi data rekening
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <SummaryCard label="Sebelum 0,7%" value={formatIDRCurrency(computed.beforeProcessing)} />
                    <SummaryCard label="Potongan 0,7%" value={formatIDRCurrency(computed.processingFeeAmount)} />
                    <SummaryCard label="Potongan 10%" value={formatIDRCurrency(computed.organizerFeeAmount)} />
                    <SummaryCard label="Diterima Tim" value={formatIDRCurrency(computed.participantTakeHome)} highlight />
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Catatan untuk tim
                      </label>
                      <textarea
                        rows={3}
                        value={row.adminNotesInput}
                        onChange={(e) => handleFieldChange(row.teamId, "adminNotesInput", e.target.value)}
                        className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                        placeholder="Informasi tambahan yang ingin disampaikan ke peserta"
                      />
                    </div>
                    <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                      <p>
                        <span className="font-semibold text-dark dark:text-white">Status saat ini:</span> {" "}
                        {PAYOUT_STATUS_OPTIONS.find((item) => item.value === row.status)?.label}
                      </p>
                      <p>
                        <span className="font-semibold text-dark dark:text-white">Catatan peserta:</span> {" "}
                        {row.participantNotes || "-"}
                      </p>
                      <p>
                        <span className="font-semibold text-dark dark:text-white">Terakhir diperbarui:</span> {" "}
                        {row.updatedAt ? new Date(row.updatedAt).toLocaleString("id-ID") : "Belum ada"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => handleSave(row.teamId)}
                      disabled={savingId === row.teamId}
                      className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      {savingId === row.teamId ? "Menyimpan..." : "Simpan Pengaturan"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="flex-1 rounded-2xl border border-stroke bg-white p-5 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="mt-2 text-2xl font-bold text-dark dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${
        highlight
          ? "border-green-500/40 bg-green-50 text-green-800 dark:border-green-500/40 dark:bg-green-900/10 dark:text-green-100"
          : "border-stroke bg-gray-50 text-gray-600 dark:border-dark-3 dark:bg-dark-2 dark:text-gray-300"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
