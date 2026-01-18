"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { uploadToMinio, getPresignedUrl } from "@/lib/minio";

export async function getGlobalSettings() {
    try {
        const settings = await prisma.globalSettings.findMany();
        // Convert array to object for easier access { key: value }
        const settingsMap: Record<string, string> = {};
        
        for (const s of settings) {
             let val = s.value;
             try {
                // If it's a JSON array (slider images), parse and sign each
                if (val.startsWith("[") && val.endsWith("]")) {
                    const arr = JSON.parse(val);
                    if (Array.isArray(arr)) {
                        const signedArr = await Promise.all(arr.map(async (item) => {
                             if (typeof item === 'string' && !item.startsWith('http') && !item.startsWith('/')) {
                                 return await getPresignedUrl(item);
                             }
                             return item;
                        }));
                        val = JSON.stringify(signedArr);
                    }
                } else if (!val.startsWith('http') && !val.startsWith('/') && val.includes("content/")) {
                    // Check if likely a minio key (simple heuristic or checking folder)
                    val = await getPresignedUrl(val);
                }
             } catch (e) {
                 // ignore parse errors
             }
             settingsMap[s.key] = val;
        }

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
                
                let filePath = "";
                try {
                     const fileName = `${Date.now()}-${value.name.replaceAll(" ", "_")}`;
                     filePath = await uploadToMinio(value, fileName, "content");
                } catch (e) {
                     console.error("Upload failed", e);
                     continue;
                }

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
