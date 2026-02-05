"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTeamInventory(teamId?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    let targetTeamId = teamId;

    // If no teamId provided, get the user's team
    if (!targetTeamId && (session.user as any).role === "PARTICIPANT") {
      const user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        include: { team: true },
      });
      if (!user?.team) {
        return { success: false, error: "Team not found" };
      }
      targetTeamId = user.team.id;
    }

    // For admin, teamId must be provided
    if (!targetTeamId) {
      return { success: false, error: "Team ID required" };
    }

    // Check authorization
    if ((session.user as any).role === "PARTICIPANT") {
      const user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        include: { team: true },
      });
      if (user?.team?.id !== targetTeamId) {
        return { success: false, error: "Unauthorized" };
      }
    }

    const items = await prisma.inventoryItem.findMany({
      where: { teamId: targetTeamId },
      orderBy: { createdAt: "desc" },
    });

    const submission = await prisma.inventorySubmission.findUnique({
      where: { teamId: targetTeamId },
    });

    return { success: true, items, submission };
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return { success: false, error: "Failed to fetch inventory" };
  }
}

export async function getAllInventories() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const teams = await prisma.team.findMany({
      where: {
        inventorySubmission: {
          isNot: null,
        },
      },
      include: {
        inventoryItems: {
          orderBy: { createdAt: "desc" },
        },
        inventorySubmission: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return { success: true, teams };
  } catch (error) {
    console.error("Error fetching all inventories:", error);
    return { success: false, error: "Failed to fetch inventories" };
  }
}

export async function addInventoryItem(data: {
  name: string;
  category: string;
  quantity: number;
  unit?: string;
  description?: string;
  watt?: number;
  ampere?: number;
  voltage?: number;
  brand?: string;
  material?: string;
  dimensions?: string;
  weight?: number;
  condition?: string;
  notes?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "PARTICIPANT") {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { team: true },
    });

    if (!user?.team) {
      return { success: false, error: "Team not found" };
    }

    const item = await prisma.inventoryItem.create({
      data: {
        teamId: user.team.id,
        name: data.name,
        category: data.category as any,
        quantity: data.quantity,
        unit: data.unit,
        description: data.description,
        watt: data.watt,
        ampere: data.ampere,
        voltage: data.voltage,
        brand: data.brand,
        material: data.material,
        dimensions: data.dimensions,
        weight: data.weight,
        condition: data.condition,
        notes: data.notes,
      },
    });

    revalidatePath("/inventory");
    return { success: true, item };
  } catch (error) {
    console.error("Error adding inventory item:", error);
    return { success: false, error: "Failed to add item" };
  }
}

export async function updateInventoryItem(
  itemId: string,
  data: {
    name?: string;
    category?: string;
    quantity?: number;
    unit?: string;
    description?: string;
    watt?: number;
    ampere?: number;
    voltage?: number;
    brand?: string;
    material?: string;
    dimensions?: string;
    weight?: number;
    condition?: string;
    notes?: string;
  }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "PARTICIPANT") {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { team: true },
    });

    if (!user?.team) {
      return { success: false, error: "Team not found" };
    }

    // Verify item belongs to user's team
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.teamId !== user.team.id) {
      return { success: false, error: "Item not found or unauthorized" };
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.watt !== undefined) updateData.watt = data.watt;
    if (data.ampere !== undefined) updateData.ampere = data.ampere;
    if (data.voltage !== undefined) updateData.voltage = data.voltage;
    if (data.brand !== undefined) updateData.brand = data.brand;
    if (data.material !== undefined) updateData.material = data.material;
    if (data.dimensions !== undefined) updateData.dimensions = data.dimensions;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.condition !== undefined) updateData.condition = data.condition;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updatedItem = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: updateData,
    });

    revalidatePath("/inventory");
    return { success: true, item: updatedItem };
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return { success: false, error: "Failed to update item" };
  }
}

export async function deleteInventoryItem(itemId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "PARTICIPANT") {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { team: true },
    });

    if (!user?.team) {
      return { success: false, error: "Team not found" };
    }

    // Verify item belongs to user's team
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.teamId !== user.team.id) {
      return { success: false, error: "Item not found or unauthorized" };
    }

    await prisma.inventoryItem.delete({
      where: { id: itemId },
    });

    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return { success: false, error: "Failed to delete item" };
  }
}

export async function submitInventory() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "PARTICIPANT") {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { team: true },
    });

    if (!user?.team) {
      return { success: false, error: "Team not found" };
    }

    // Check if team has any inventory items
    const itemCount = await prisma.inventoryItem.count({
      where: { teamId: user.team.id },
    });

    if (itemCount === 0) {
      return { success: false, error: "Tambahkan minimal 1 item sebelum submit" };
    }

    const submission = await prisma.inventorySubmission.upsert({
      where: { teamId: user.team.id },
      create: { teamId: user.team.id },
      update: { updatedAt: new Date() },
    });

    revalidatePath("/inventory");
    return { success: true, submission };
  } catch (error) {
    console.error("Error submitting inventory:", error);
    return { success: false, error: "Failed to submit inventory" };
  }
}
