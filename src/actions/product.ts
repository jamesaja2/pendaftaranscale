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
      include: {
        variants: {
          orderBy: { order: 'asc' },
        },
        addons: {
          orderBy: { order: 'asc' },
        },
      },
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
          include: {
            variants: {
              orderBy: { order: 'asc' },
            },
            addons: {
              orderBy: { order: 'asc' },
            },
          },
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
  description?: string;
  imageUrl?: string;
  price: number;
  stock?: number | null;
  isAvailable: boolean;
  category?: string;
  variants?: Array<{
    name: string;
    additionalPrice: number;
    isRequired: boolean;
    isAvailable: boolean;
    order: number;
  }>;
  addons?: Array<{
    name: string;
    price: number;
    isAvailable: boolean;
    order: number;
  }>;
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
        description: data.description,
        imageUrl: data.imageUrl,
        price: data.price,
        stock: data.stock,
        isAvailable: data.isAvailable,
        category: data.category,
        variants: data.variants
          ? {
              create: data.variants.map((v) => ({
                name: v.name,
                additionalPrice: v.additionalPrice,
                isRequired: v.isRequired,
                isAvailable: v.isAvailable,
                order: v.order,
              })),
            }
          : undefined,
        addons: data.addons
          ? {
              create: data.addons.map((a) => ({
                name: a.name,
                price: a.price,
                isAvailable: a.isAvailable,
                order: a.order,
              })),
            }
          : undefined,
      },
      include: {
        variants: true,
        addons: true,
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
    description?: string;
    imageUrl?: string;
    price?: number;
    stock?: number | null;
    isAvailable?: boolean;
    category?: string;
    variants?: Array<{
      id?: string;
      name: string;
      additionalPrice: number;
      isRequired: boolean;
      isAvailable: boolean;
      order: number;
    }>;
    addons?: Array<{
      id?: string;
      name: string;
      price: number;
      isAvailable: boolean;
      order: number;
    }>;
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
    if (data.description !== undefined) updateData.description = data.description;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;
    if (data.category !== undefined) updateData.category = data.category;

    // Handle variants using transaction for proper deletion and recreation
    if (data.variants !== undefined) {
      // Delete existing variants
      await prisma.productVariant.deleteMany({
        where: { productId },
      });

      // Create new variants
      updateData.variants = {
        create: data.variants.map((v) => ({
          name: v.name,
          additionalPrice: v.additionalPrice,
          isRequired: v.isRequired,
          isAvailable: v.isAvailable,
          order: v.order,
        })),
      };
    }

    // Handle addons
    if (data.addons !== undefined) {
      // Delete existing addons
      await prisma.productAddon.deleteMany({
        where: { productId },
      });

      // Create new addons
      updateData.addons = {
        create: data.addons.map((a) => ({
          name: a.name,
          price: a.price,
          isAvailable: a.isAvailable,
          order: a.order,
        })),
      };
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        variants: true,
        addons: true,
      },
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
