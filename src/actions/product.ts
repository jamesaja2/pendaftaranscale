"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTeamProducts(teamId?: string) {
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

    const products = await prisma.product.findMany({
      where: { teamId: targetTeamId },
      orderBy: { createdAt: "desc" },
    });

    const submission = await prisma.productSubmission.findUnique({
      where: { teamId: targetTeamId },
    });

    return { success: true, products, submission };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { success: false, error: "Failed to fetch products" };
  }
}

export async function getAllProducts() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const teams = await prisma.team.findMany({
      where: {
        productSubmission: {
          isNot: null,
        },
      },
      include: {
        products: {
          orderBy: { createdAt: "desc" },
        },
        productSubmission: true,
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
    console.error("Error fetching all products:", error);
    return { success: false, error: "Failed to fetch products" };
  }
}

export async function addProduct(data: {
  name: string;
  variant?: string;
  description?: string;
  imageUrl?: string;
  stock?: number;
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

    const product = await prisma.product.create({
      data: {
        teamId: user.team.id,
        name: data.name,
        variant: data.variant,
        description: data.description,
        imageUrl: data.imageUrl,
        stock: data.stock,
      },
    });

    revalidatePath("/products");
    return { success: true, product };
  } catch (error) {
    console.error("Error adding product:", error);
    return { success: false, error: "Failed to add product" };
  }
}

export async function updateProduct(
  productId: string,
  data: {
    name?: string;
    variant?: string;
    description?: string;
    imageUrl?: string;
    stock?: number;
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

    // Verify product belongs to user's team
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.teamId !== user.team.id) {
      return { success: false, error: "Product not found or unauthorized" };
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.variant !== undefined) updateData.variant = data.variant;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.stock !== undefined) updateData.stock = data.stock;

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    revalidatePath("/products");
    return { success: true, product: updatedProduct };
  } catch (error) {
    console.error("Error updating product:", error);
    return { success: false, error: "Failed to update product" };
  }
}

export async function deleteProduct(productId: string) {
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

    // Verify product belongs to user's team
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.teamId !== user.team.id) {
      return { success: false, error: "Product not found or unauthorized" };
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: "Failed to delete product" };
  }
}

export async function submitProducts() {
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

    // Check if team has any products
    const productCount = await prisma.product.count({
      where: { teamId: user.team.id },
    });

    if (productCount === 0) {
      return { success: false, error: "Tambahkan minimal 1 produk sebelum submit" };
    }

    const submission = await prisma.productSubmission.upsert({
      where: { teamId: user.team.id },
      create: { teamId: user.team.id },
      update: { updatedAt: new Date() },
    });

    revalidatePath("/products");
    return { success: true, submission };
  } catch (error) {
    console.error("Error submitting products:", error);
    return { success: false, error: "Failed to submit products" };
  }
}
