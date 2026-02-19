"use client";

import { useEffect, useMemo, useState } from "react";
import { getMyPayout, submitParticipantBankInfo } from "@/actions/payout";
import {
  PAYOUT_STATUS_OPTIONS,
  PayoutStatus,
  formatIDRCurrency,
} from "@/lib/payoutMath";
import { ParticipantPayoutDTO } from "@/types/payout";

const statusBadgeStyles: Record<PayoutStatus, string> = {
  WAITING_VERIFICATION: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
  PROCESSING: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  TRANSFERRED: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
};

const statusMap = Object.fromEntries(
  PAYOUT_STATUS_OPTIONS.map((item) => [item.value, item.label])
) as Record<PayoutStatus, string>;

export default function ParticipantPayoutView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ParticipantPayoutDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const response = await getMyPayout();
    if (!response.success || !response.data) {
      setError(response.error || "Tidak dapat mengambil data payout");
      setData(null);
      setLoading(false);
      return;
    }

    setData(response.data);
    setAccountName(response.data.bankAccountName || "");
    setAccountNumber(response.data.bankAccountNumber || "");
    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const computed = data?.computed;
  const statusLabel = data ? statusMap[data.status] : "-";

  const timeline = useMemo(() => {
    return PAYOUT_STATUS_OPTIONS.map((item) => ({
      value: item.value,
      label: item.label,
      completed:
        data?.status === item.value ||
        PAYOUT_STATUS_OPTIONS.findIndex((opt) => opt.value === data?.status) >=
          PAYOUT_STATUS_OPTIONS.findIndex((opt) => opt.value === item.value),
    }));
  }, [data?.status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim() || !accountNumber.trim()) {
      setError("Nama dan nomor rekening wajib diisi");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    const response = await submitParticipantBankInfo({
      accountName,
      accountNumber,
    });
    setSaving(false);

    if (!response.success) {
      setError(response.error || "Gagal menyimpan data rekening");
      return;
    }

    setSuccessMessage("Data rekening berhasil disimpan. Panitia akan mengecek kembali.");
    fetchData();
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-stroke bg-white p-6 text-sm text-gray-500 dark:border-dark-3 dark:bg-gray-dark dark:text-gray-300">
        Memuat informasi payout...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/10 dark:text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/10 dark:text-red-200">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800/40 dark:bg-green-900/10 dark:text-green-200">
          {successMessage}
        </div>
      )}

      <div className="rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">Status pencairan</p>
            <h2 className="text-3xl font-bold text-dark dark:text-white">{statusLabel}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Terakhir diperbarui: {data?.updatedAt ? new Date(data.updatedAt).toLocaleString("id-ID") : "Belum ada"}</p>
          </div>
          {data && (
            <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${statusBadgeStyles[data.status]}`}>
              {statusLabel}
            </span>
          )}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <InfoCard label="Saldo dari Panitia" value={computed ? formatIDRCurrency(computed.recordedAmount) : "Rp0"} />
          <InfoCard label="Estimasi sebelum 0,7%" value={computed ? formatIDRCurrency(computed.beforeProcessing) : "Rp0"} />
          <InfoCard label="Potongan 10%" value={computed ? formatIDRCurrency(computed.organizerFeeAmount) : "Rp0"} />
          <InfoCard label="Perkiraan diterima" value={computed ? formatIDRCurrency(computed.participantTakeHome) : "Rp0"} highlight />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
            <h3 className="text-xl font-semibold text-dark dark:text-white">Timeline pencairan</h3>
            <ol className="mt-6 space-y-4">
              {timeline.map((step) => (
                <li key={step.value} className="flex items-start gap-4">
                  <div
                    className={`mt-1 h-3 w-3 rounded-full ${
                      data?.status === step.value
                        ? "bg-brand-500"
                        : step.completed
                        ? "bg-green-500"
                        : "bg-gray-300 dark:bg-dark-4"
                    }`}
                  />
                  <div>
                    <p className="font-semibold text-dark dark:text-white">{step.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {step.value === "WAITING_VERIFICATION" && "Panitia sedang memastikan laporan penjualan final."}
                      {step.value === "PROCESSING" && "Dana dijadwalkan untuk pencairan."}
                      {step.value === "TRANSFERRED" && "Dana sudah ditransfer ke rekening BCA tim."}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
            <h3 className="text-xl font-semibold text-dark dark:text-white">Catatan dari panitia</h3>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              {data?.adminNotes || "Belum ada catatan tambahan."}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
          <h3 className="text-xl font-semibold text-dark dark:text-white">Rekening penerima (BCA)</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Pastikan data benar agar dana dapat ditransfer.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Nama pemilik rekening
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                placeholder="Contoh: Andi Wijaya"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Nomor rekening BCA
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ""))}
                className="mt-1 w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                placeholder="1234567890"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan Data Rekening"}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Perubahan akan dikonfirmasi oleh panitia dalam dashboard ini.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
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
