'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { checkYoGatewayPaymentStatus } from '@/lib/yogateway';

export async function checkPaymentStatus(teamId: string) {
  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || !team.paymentTrxId) {
      return { success: false, message: 'Transaction ID not found.' };
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
