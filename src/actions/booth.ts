"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getBooths() {
  try {
    const booths = await prisma.boothLocation.findMany({
      include: { team: true },
      orderBy: { name: 'asc' }
    });
    return { success: true, data: booths };
  } catch (error) {
    return { success: false, error: "Failed to fetch booths" };
  }
}

export async function createBooth(formData: FormData) {
  const name = formData.get("name") as string;
  const type = formData.get("type") as string; // 'STANDARD', 'PREMIUM' etc

  if (!name) return { success: false, error: "Name is required" };

  try {
    await prisma.boothLocation.create({
      data: {
        name,
        // type: type || "STANDARD" // Field missing in schema
      }
    });
    revalidatePath("/booths");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to create booth" };
  }
}

export async function deleteBooth(id: string) {
  try {
    await prisma.boothLocation.delete({ where: { id } });
    revalidatePath("/booths");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete booth" };
  }
}
