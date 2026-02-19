import { ComputedPayout, PayoutStatus } from "@/lib/payoutMath";

export interface AdminPayoutRowDTO {
  teamId: string;
  teamName: string;
  leaderName: string | null;
  contactEmail: string;
  recordedAmount: number | null;
  status: PayoutStatus;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  adminNotes: string | null;
  participantNotes: string | null;
  updatedAt: string | null;
  computed: ComputedPayout;
}

export interface ParticipantPayoutDTO {
  teamId: string;
  teamName: string;
  recordedAmount: number | null;
  status: PayoutStatus;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  adminNotes: string | null;
  updatedAt: string | null;
  computed: ComputedPayout;
}
