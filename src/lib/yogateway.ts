"use server";

import prisma from "@/lib/prisma";
import crypto from 'crypto';

/**
 * Creates a payment transaction via YoGateway API.
 * @param amount Amount in IDR (min 1000)
 * @returns { success: boolean, data?: any, error?: string }
 */
export async function createYoGatewayPayment(amount: number) {
  try {
    const settings = await prisma.globalSettings.findMany({
      where: {
        key: { in: ['payment_gateway_id', 'payment_gateway_key'] }
      }
    });

    const apiKey = settings.find(s => s.key === 'payment_gateway_key')?.value;
    
    // We don't actually need ID for the API call according to doc, just API Key?
    // Doc says: apikey=...
    // But usually Gateway ID is needed somewhere, or maybe API Key interacts.
    // The user prompts "payment_gateway_id" in settings, so maybe it's used?
    // Looking at the doc provided: 
    // $url = "https://yogateway.id//api.php?action=createpayment&apikey=yo_sec_...&amount=10000";
    // It seems only API KEY (yo_sec_...) is needed.
    
    if (!apiKey) {
      console.error("YoGateway API Key missing");
      return { success: false, error: "Payment Gateway configuration missing" };
    }

    const apiUrl = `https://yogateway.id/api.php?action=createpayment&apikey=${apiKey}&amount=${amount}`;
    
    const response = await fetch(apiUrl);
    const result = await response.json();

    if (result.status && result.data) {
      return { success: true, data: result.data };
    } else {
      console.error("YoGateway Error:", result);
      return { success: false, error: "Failed to create payment link" };
    }

  } catch (error) {
    console.error("YoGateway Exception:", error);
    return { success: false, error: "Exception calling Payment Gateway" };
  }
}

/**
 * Checks payment status via YoGateway API.
 * @param trxId Transaction ID (e.g. YO-...)
 */
export async function checkYoGatewayPaymentStatus(trxId: string) {
  try {
    const settings = await prisma.globalSettings.findMany({
       where: { key: 'payment_gateway_key' }
    });
    const apiKey = settings.find(s => s.key === 'payment_gateway_key')?.value;

    if (!apiKey) return { success: false, error: "API Key missing" };

    const apiUrl = `https://yogateway.id/api.php?action=checkstatus&apikey=${apiKey}&trxid=${trxId}`;
    console.log("Checking Payment Status:", apiUrl); // Log for debugging

    const response = await fetch(apiUrl, { cache: 'no-store' });
    const result = await response.json();

    // Result structure:
    // { status: true, data: { status: "SUCCESS" | "PENDING" | "EXPIRED", ... } }
    
    if (result.status && result.data) {
        return { success: true, status: result.data.status, data: result.data };
    }
    
    return { success: false, error: "Invalid response from gateway" };

  } catch (error) {
    console.error("YoGateway Check Exception:", error);
    return { success: false, error: "Exception calling Check Status" };
  }
}
