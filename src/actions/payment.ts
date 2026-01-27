'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { checkYoGatewayPaymentStatus, createYoGatewayPayment } from '@/lib/yogateway';
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
type PaymentPlanOption = 'FULL' | 'DOWN_PAYMENT';

export async function updatePaymentMethod(option: PaymentMethodOption) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.id) {
    return { error: 'Unauthorized' };
  }

  const team = await prisma.team.findUnique({ where: { userId: (session.user as any).id } });
  if (!team) {
    return { error: 'Team not found' };
  }

  if (!team.paymentPlan) {
    return { error: 'Please choose a payment plan before selecting a payment method.' };
  }

  if (team.paymentPlan === 'DOWN_PAYMENT' && !team.paymentPlanAcceptedAt) {
    return { error: 'Accept the down payment terms before continuing.' };
  }

  if (team.paymentStatus === 'PAID' || team.paymentStatus === 'VERIFIED') {
    return { error: 'Payment already completed' };
  }

  if (team.paymentMethod === option && option === 'QRIS' && team.paymentTrxId) {
    return { success: true };
  }

  const data: any = {
    paymentMethod: option,
    paymentStatus: 'PENDING',
    paidAt: null,
  };

  if (option === 'QRIS') {
    const feeSetting = await prisma.globalSettings.findUnique({ where: { key: 'registration_fee' } });
    const feeValue = feeSetting?.value ? parseInt(feeSetting.value, 10) : 0;
    if (!feeValue || feeValue < 1000) {
      return { error: 'Registration fee must be at least IDR 1,000 before enabling QRIS payments.' };
    }

    const payment = await createYoGatewayPayment(feeValue);
    if (!payment.success || !payment.data) {
      return { error: payment.error || 'Failed to create QRIS payment session. Please try again.' };
    }

    const { trx_id, payment_url, expired_at } = payment.data as any;
    if (!trx_id || !payment_url) {
      return { error: 'Incomplete response from payment gateway.' };
    }

    const parsedDeadline = expired_at ? new Date(expired_at) : null;
    const deadline = parsedDeadline && !isNaN(parsedDeadline.getTime())
      ? parsedDeadline
      : (() => {
          const fallback = new Date();
          fallback.setMinutes(fallback.getMinutes() + 10);
          return fallback;
        })();

    data.paymentTrxId = trx_id;
    data.paymentUrl = payment_url;
    data.paymentDeadline = deadline;
    data.manualPaymentAmount = null;
    data.manualPaymentNote = null;
    data.manualPaymentProof = null;
    data.manualPaymentSubmittedAt = null;
  } else {
    data.paymentDeadline = null;
    data.paymentTrxId = null;
    data.paymentUrl = null;
  }

  await prisma.team.update({
    where: { id: team.id },
    data,
  });

  revalidatePath('/');
  revalidatePath('/register');
  return { success: true };
}

export async function updatePaymentPlan(option: PaymentPlanOption, acceptTerms?: boolean) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.id) {
    return { error: 'Unauthorized' };
  }

  const team = await prisma.team.findUnique({ where: { userId: (session.user as any).id } });
  if (!team) {
    return { error: 'Team not found' };
  }

  if (team.paymentStatus === 'PAID' || team.paymentStatus === 'VERIFIED') {
    return { error: 'Payment already completed' };
  }

  if (option === 'DOWN_PAYMENT' && !acceptTerms) {
    return { error: 'You must accept the down payment terms before continuing.' };
  }

  const data: any = {
    paymentPlan: option,
  };

  if (option === 'FULL') {
    data.paymentPlanAcceptedAt = new Date();
  } else if (option === 'DOWN_PAYMENT') {
    data.paymentPlanAcceptedAt = acceptTerms ? new Date() : null;
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
