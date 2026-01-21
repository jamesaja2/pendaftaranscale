'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { checkYoGatewayPaymentStatus } from '@/lib/yogateway';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function checkPaymentStatus(teamId: string) {
  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || !team.paymentTrxId) {
      return { success: false, message: 'Transaction ID not found.' };
    }

    if (team.paymentMethod !== 'QRIS') {
      return { success: false, message: 'Manual transfer requires admin verification.' };
    }

    // Call Real YoGateway
    const check = await checkYoGatewayPaymentStatus(team.paymentTrxId);
    
    console.log(`[CheckPayment] Team: ${team.name} (${teamId}) - Trx: ${team.paymentTrxId} - Result:`, check);

    if (check.success && check.status === 'SUCCESS') {
      await prisma.team.update({
        where: { id: teamId },
        data: {
            paymentStatus: 'PAID',
            paidAt: new Date(),
        },
      });
      revalidatePath('/participant/dashboard');
      revalidatePath('/');
      return { success: true, message: 'Payment verified! You can now proceed.' };
    } 
    else if (check.success && check.status === 'EXPIRED') {
       return { success: false, message: 'Payment has EXPIRED. Please register again or contact admin.' };
    }

    return { success: false, message: `Status: ${check.status || 'PENDING'}. Please wait or try again.` };

  } catch (error) {
    console.error("CheckStatus Action Error:", error);
    return { success: false, message: "System error checking payment." };
  }
}

type PaymentMethodOption = 'QRIS' | 'MANUAL_TRANSFER';

export async function updatePaymentMethod(option: PaymentMethodOption) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.id) {
    return { error: 'Unauthorized' };
  }

  const team = await prisma.team.findUnique({ where: { userId: (session.user as any).id } });
  if (!team) {
    return { error: 'Team not found' };
  }

  const data: any = {
    paymentMethod: option,
  };

  if (option === 'QRIS') {
    const deadline = new Date();
    deadline.setMinutes(deadline.getMinutes() + 10);
    data.paymentDeadline = deadline;
  } else {
    data.paymentDeadline = null;
  }

  if (option === 'QRIS') {
    data.manualPaymentAmount = null;
    data.manualPaymentNote = null;
    data.manualPaymentProof = null;
    data.manualPaymentSubmittedAt = null;
  }

  await prisma.team.update({
    where: { id: team.id },
    data,
  });

  revalidatePath('/');
  revalidatePath('/register');
  return { success: true };
}

type ManualProofPayload = {
  amount: number;
  note?: string;
  proofKey: string;
};

export async function submitManualPaymentProofAction(payload: ManualProofPayload) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.id) {
    return { error: 'Unauthorized' };
  }

  const team = await prisma.team.findUnique({ where: { userId: (session.user as any).id } });
  if (!team) {
    return { error: 'Team not found' };
  }

  const normalizedAmount = Math.round(Number(payload.amount));
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    return { error: 'Invalid amount' };
  }

  if (!payload.proofKey) {
    return { error: 'Upload proof first' };
  }

  await prisma.team.update({
    where: { id: team.id },
    data: {
      paymentMethod: 'MANUAL_TRANSFER',
      paymentStatus: 'PENDING',
      paymentDeadline: null,
      manualPaymentAmount: normalizedAmount,
      manualPaymentNote: payload.note?.trim() || null,
      manualPaymentProof: payload.proofKey,
      manualPaymentSubmittedAt: new Date(),
    },
  });

  revalidatePath('/');
  revalidatePath('/register');
  return { success: true };
}
