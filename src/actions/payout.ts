"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  computePayoutFromRecorded,
  PayoutStatus,
} from "@/lib/payoutMath";
import { AdminPayoutRowDTO, ParticipantPayoutDTO } from "@/types/payout";

const ADMIN_REVALIDATE_PATHS = ["/payouts", "/my-payout"];

function revalidatePayoutPaths() {
  ADMIN_REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
}

function isAdmin(session: any) {
  return session?.user && (session.user as any).role === "ADMIN";
}

async function getCurrentTeamId(session: any) {
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    include: { team: true },
  });
  return user?.team?.id ?? null;
}

export async function getPayoutDashboard(): Promise<{
  success: boolean;
  data?: AdminPayoutRowDTO[];
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return { success: false, error: "Unauthorized" };
    }

    const teams = await prisma.team.findMany({
      include: {
        payout: true,
        user: { select: { email: true } },
      },
      orderBy: { name: "asc" },
    });

    const data: AdminPayoutRowDTO[] = teams.map((team) => {
      const recordedAmount = team.payout?.recordedAmount ?? null;
      const computed = computePayoutFromRecorded(recordedAmount);
      return {
        teamId: team.id,
        teamName: team.name || "Tanpa Nama",
        leaderName: team.leaderName || null,
        contactEmail: team.user.email,
        recordedAmount,
        status: team.payout?.status || "WAITING_VERIFICATION",
        bankAccountName: team.payout?.bankAccountName || null,
        bankAccountNumber: team.payout?.bankAccountNumber || null,
        adminNotes: team.payout?.adminNotes || null,
        participantNotes: team.payout?.participantNotes || null,
        updatedAt: team.payout?.updatedAt?.toISOString() || null,
        computed,
      };
    });

    return { success: true, data };
  } catch (error) {
    console.error("getPayoutDashboard error", error);
    return { success: false, error: "Failed to fetch payouts" };
  }
}

export async function savePayoutAdminChanges(input: {
  teamId: string;
  recordedAmount?: number | null;
  status?: PayoutStatus;
  adminNotes?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return { success: false, error: "Unauthorized" };
    }

    if (!input.teamId) {
      return { success: false, error: "Team ID is required" };
    }

    const amountProvided =
      typeof input.recordedAmount === "number" && !Number.isNaN(input.recordedAmount);
    const normalizedAmount = amountProvided
      ? Math.max(0, Number(input.recordedAmount))
      : undefined;

    const updateData: Record<string, any> = {
      updatedBy: (session!.user as any).id,
    };

    if (amountProvided && typeof normalizedAmount === "number") {
      updateData.recordedAmount = normalizedAmount;
    }
    if (typeof input.adminNotes === "string") {
      updateData.adminNotes = input.adminNotes;
    }
    if (input.status) {
      updateData.status = input.status;
    }

    await prisma.teamPayout.upsert({
      where: { teamId: input.teamId },
      create: {
        teamId: input.teamId,
        recordedAmount: normalizedAmount ?? 0,
        status: input.status || "WAITING_VERIFICATION",
        adminNotes: input.adminNotes ?? null,
        updatedBy: (session!.user as any).id,
      },
      update: updateData,
    });

    revalidatePayoutPaths();
    return { success: true };
  } catch (error) {
    console.error("savePayoutAdminChanges error", error);
    return { success: false, error: "Failed to save payout" };
  }
}

export async function getMyPayout(): Promise<{
  success: boolean;
  data?: ParticipantPayoutDTO;
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: {
        team: {
          include: { payout: true },
        },
      },
    });

    if (!user?.team) {
      return { success: false, error: "Anda belum memiliki tim" };
    }

    const recordedAmount = user.team.payout?.recordedAmount ?? null;
    const computed = computePayoutFromRecorded(recordedAmount);

    const data: ParticipantPayoutDTO = {
      teamId: user.team.id,
      teamName: user.team.name || "Tim",
      recordedAmount,
      status: user.team.payout?.status || "WAITING_VERIFICATION",
      bankAccountName: user.team.payout?.bankAccountName || null,
      bankAccountNumber: user.team.payout?.bankAccountNumber || null,
      adminNotes: user.team.payout?.adminNotes || null,
      updatedAt: user.team.payout?.updatedAt?.toISOString() || null,
      computed,
    };

    return { success: true, data };
  } catch (error) {
    console.error("getMyPayout error", error);
    return { success: false, error: "Gagal mengambil data payout" };
  }
}

export async function submitParticipantBankInfo(input: {
  accountName: string;
  accountNumber: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const teamId = await getCurrentTeamId(session);
    if (!teamId) {
      return { success: false, error: "Tim tidak ditemukan" };
    }

    const trimmedName = input.accountName?.trim();
    const trimmedNumber = input.accountNumber?.replace(/\s+/g, "");

    if (!trimmedName) {
      return { success: false, error: "Nama pemilik rekening wajib diisi" };
    }
    if (!trimmedNumber) {
      return { success: false, error: "Nomor rekening wajib diisi" };
    }

    await prisma.teamPayout.upsert({
      where: { teamId },
      create: {
        teamId,
        bankAccountName: trimmedName,
        bankAccountNumber: trimmedNumber,
      },
      update: {
        bankAccountName: trimmedName,
        bankAccountNumber: trimmedNumber,
      },
    });

    revalidatePayoutPaths();
    return { success: true };
  } catch (error) {
    console.error("submitParticipantBankInfo error", error);
    return { success: false, error: "Gagal menyimpan data rekening" };
  }
}

export async function updatePayoutStatus(input: {
  teamId: string;
  status: PayoutStatus;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.teamPayout.upsert({
      where: { teamId: input.teamId },
      create: {
        teamId: input.teamId,
        status: input.status,
      },
      update: {
        status: input.status,
        updatedBy: (session!.user as any).id,
      },
    });

    revalidatePayoutPaths();
    return { success: true };
  } catch (error) {
    console.error("updatePayoutStatus error", error);
    return { success: false, error: "Gagal memperbarui status" };
  }
}
