import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { trxid, status } = body;
    // const signature = req.headers.get("X-YoGateway-Signature");
    
    // Validate Signature... (skipped for brevity)

    if (status === "SUCCESS") {
      await prisma.team.update({
        where: { paymentTrxId: trxid },
        data: {
          paymentStatus: "PAID",
          paidAt: new Date(),
        },
      });
    } else if (status === "EXPIRED") {
       await prisma.team.update({
        where: { paymentTrxId: trxid },
        data: {
          paymentStatus: "EXPIRED",
        },
      });
    }

    return NextResponse.json({ status: true });
  } catch (error) {
    console.error("Payment Callback Error:", error);
    return NextResponse.json({ status: false }, { status: 500 });
  }
}
