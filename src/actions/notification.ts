"use server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createAnnouncement(title: string, message: string) {
    try {
        await prisma.notification.create({
            data: {
                title,
                message
            }
        });
        revalidatePath("/"); // Revalidate everywhere as this affects header
        return { success: true };
    } catch (error) {
        return { error: "Failed to create announcement" };
    }
}

export async function getNotifications(limit = 5) {
    try {
        const notifications = await prisma.notification.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit
        });
        return notifications;
    } catch (error) {
        return [];
    }
}
