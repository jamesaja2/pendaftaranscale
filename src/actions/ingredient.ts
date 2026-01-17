"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getIngredients() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: "asc" },
    });
    return { success: true, data: ingredients };
  } catch (error) {
    console.error("Error getting ingredients:", error);
    return { success: false, error: "Failed to get ingredients" };
  }
}

export async function createIngredient(name: string) {
  try {
    if (!name) return { success: false, error: "Name is required" };

    await prisma.ingredient.create({
      data: {
        name,
        // Default usage is 0
      },
    });

    revalidatePath("/(admin)/(others-pages)/content");
    return { success: true };
  } catch (error) {
    console.error("Error creating ingredient:", error);
    return { success: false, error: "Failed to create ingredient" };
  }
}

export async function deleteIngredient(id: string) {
  try {
    await prisma.ingredient.delete({
      where: { id },
    });
    revalidatePath("/(admin)/(others-pages)/content");
    return { success: true };
  } catch (error) {
    console.error("Error deleting ingredient:", error);
    return { success: false, error: "Failed to delete ingredient" };
  }
}
