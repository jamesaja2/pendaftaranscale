"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Assuming authOptions is exported here, if not need to find it
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function getUserProfile() {
    const session = await getServerSession(authOptions as any);
    if (!session || !(session as any).user) return { error: "Unauthorized" };
    
    const email = (session as any).user.email;
    
    // Fetch user with team
    const user = await prisma.user.findUnique({
        where: { email: email! },
        include: { team: { include: { mainIngredient: true, boothLocation: true } } }
    });

    if (!user) return { error: "User not found" };
    return { success: true, user };
}

export async function updateUserProfile(formData: FormData) {
    const session = await getServerSession(authOptions as any);
    if (!session || !(session as any).user) return { error: "Unauthorized" };

    const email = (session as any).user.email;
    const user = await prisma.user.findUnique({ where: { email: email! }, include: { team: true } });
    
    if (!user) return { error: "User not found" };

    const name = formData.get("name") as string;
    const imageFile = formData.get("image") as File | null;
    const newPassword = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    
    let imageUrl = user.image;

    // Handle Image Upload
    if (imageFile && imageFile.size > 0 && imageFile.name !== "undefined") {
        try {
            const bytes = await imageFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            
            // Create a unique filename
            const ext = path.extname(imageFile.name) || ".jpg";
            const filename = `params-${user.id}-${Date.now()}${ext}`;
            const uploadDir = path.join(process.cwd(), "public/images/user");
            
            // Ensure dir exists
            await mkdir(uploadDir, { recursive: true });
            
            const filePath = path.join(uploadDir, filename);
            await writeFile(filePath, buffer);
            
            imageUrl = `/images/user/${filename}`;
        } catch (error) {
            console.error("Image upload failed:", error);
            return { error: "Failed to upload image" };
        }
    }

    // Prepare Update Data
    const updateData: any = {
        name: name || undefined,
        image: imageUrl
    };

    // Password Change
    if (newPassword) {
        if (newPassword !== confirmPassword) return { error: "Passwords do not match" };
        const hashed = await bcrypt.hash(newPassword, 10);
        updateData.password = hashed;
    }
    
    // Update User
    await prisma.user.update({
         where: { id: user.id },
         data: updateData
    });

    // Team Updates (for Participants)
    if (user.role === 'PARTICIPANT' && user.team) {
        const teamName = formData.get("teamName") as string;
        const contactInfo = formData.get("contactInfo") as string;
        
        await prisma.team.update({
            where: { id: user.team.id },
            data: {
                name: teamName || user.team.name,
                contactInfo: contactInfo || user.team.contactInfo
            }
        });
    }

    revalidatePath("/profile");
    return { success: true };
}
