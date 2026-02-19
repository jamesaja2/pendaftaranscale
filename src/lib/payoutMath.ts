export const ORGANIZER_FEE_RATE = 0.10; // 10%
export const PROCESSING_FEE_RATE = 0.007; // 0.7%

export const PAYOUT_STATUS_OPTIONS = [
  { value: "WAITING_VERIFICATION" as const, label: "Menunggu Verifikasi" },
  { value: "PROCESSING" as const, label: "Sedang Diproses" },
  { value: "TRANSFERRED" as const, label: "Berhasil Ditranfer" },
];

export type PayoutStatus = (typeof PAYOUT_STATUS_OPTIONS)[number]["value"];

export type ComputedPayout = {
  recordedAmount: number;
  beforeProcessing: number;
  processingFeeAmount: number;
  organizerFeeAmount: number;
  participantTakeHome: number;
};

export function computePayoutFromRecorded(recordedAmount?: number | null): ComputedPayout {
  const safeRecorded = typeof recordedAmount === "number" && recordedAmount > 0 ? recordedAmount : 0;
  if (safeRecorded === 0) {
    return {
      recordedAmount: 0,
      beforeProcessing: 0,
      processingFeeAmount: 0,
      organizerFeeAmount: 0,
      participantTakeHome: 0,
    };
  }

  const beforeProcessing = safeRecorded / (1 - PROCESSING_FEE_RATE);
  const processingFeeAmount = beforeProcessing * PROCESSING_FEE_RATE;
  const organizerFeeAmount = beforeProcessing * ORGANIZER_FEE_RATE;
  const participantTakeHome = beforeProcessing - organizerFeeAmount;

  return {
    recordedAmount: safeRecorded,
    beforeProcessing,
    processingFeeAmount,
    organizerFeeAmount,
    participantTakeHome,
  };
}

export function formatIDRCurrency(value: number, fractionDigits = 0) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value);
}
