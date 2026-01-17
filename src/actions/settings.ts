"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function getGlobalSettings() {
    try {
        const settings = await prisma.globalSettings.findMany();
        // Convert array to object for easier access { key: value }
        const settingsMap: Record<string, string> = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });
        return { success: true, data: settingsMap };
    } catch (error) {
        console.error("Error fetching settings:", error);
        return { success: false, error: "Failed to fetch settings" };
    }
}

export async function updateContentSettings(formData: FormData) {
    try {
        // Handle files and plain text
        // We will loop through keys. If value is File, we "upload" it.
        
        const entries = Array.from(formData.entries());

        for (const [key, value] of entries) {
            if (!key.startsWith("setting_")) continue;
            
            const settingKey = key.replace("setting_", "");
            
            let storedValue = "";

            if (value instanceof File) {
                if (value.size === 0) continue; // Skip empty files
                
                const buffer = Buffer.from(await value.arrayBuffer());
                const fileName = `${Date.now()}-${value.name.replaceAll(" ", "_")}`;
                const uploadDir = path.join(process.cwd(), "public/uploads");
                
                // Ensure dir exists
                await mkdir(uploadDir, { recursive: true });
                
                await writeFile(path.join(uploadDir, fileName), buffer);
                const filePath = `/uploads/${fileName}`;

                // Logic for slider_images: Append to existing array
                if (settingKey === "slider_images") {
                    const currentSetting = await prisma.globalSettings.findUnique({ where: { key: "slider_images" } });
                    let images: string[] = [];
                    try {
                        if (currentSetting?.value) images = JSON.parse(currentSetting.value);
                    } catch (e) {}
                    
                    images.push(filePath);
                    storedValue = JSON.stringify(images);
                } else {
                    storedValue = filePath;
                }
            } else {
                storedValue = value as string;
            }

            if (storedValue) {
               await prisma.globalSettings.upsert({
                   where: { key: settingKey },
                   update: { value: storedValue },
                   create: { key: settingKey, value: storedValue }
               });
            }
        }

        revalidatePath("/content");
        return { success: true };
    } catch (error) {
        console.error("Error updating settings:", error);
        return { success: false, error: "Failed to update settings" };
    }
}

export async function deleteSliderImage(imagePath: string) {
    try {
        const currentSetting = await prisma.globalSettings.findUnique({ where: { key: "slider_images" } });
        if (!currentSetting?.value) return { success: false };
        
        let images: string[] = [];
        try {
            images = JSON.parse(currentSetting.value);
        } catch (e) {
            return { success: false };
        }

        const newImages = images.filter(img => img !== imagePath);
        
        await prisma.globalSettings.update({
            where: { key: "slider_images" },
            data: { value: JSON.stringify(newImages) }
        });
        
        revalidatePath("/content");
        return { success: true };
    } catch (error) {
         return { success: false };
    }
}
