"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Max file size 50MB (handled by frontend usually, but good to know)
import { uploadToFileServer, getPublicFileUrl } from "@/lib/fileServer";

export async function getResources() {
  try {
    const resources = await prisma.resource.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    // Generate presigned URLs for each resource
    const processedResources = await Promise.all(resources.map(async (r) => {
        if (r.fileUrl && !r.fileUrl.startsWith('http')) {
          const resolved = getPublicFileUrl(r.fileUrl);
          if (resolved) {
            r.fileUrl = resolved;
          }
        }
        return r;
    }));

    return processedResources;
  } catch (error) {
    console.error("Error fetching resources:", error);
    return [];
  }
}

export async function createResource(formData: FormData) {
  try {
    const title = formData.get("title") as string;
    const file = formData.get("file") as File | null;
    const link = formData.get("link") as string | null;

    if (!title) {
      return { success: false, error: "Title is required" };
    }

    let fileUrl = "";

    if (link) {
        fileUrl = link;
    } else if (file && file.size > 0) {
        try {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const filename = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
            const finalFilename = `${uniqueSuffix}-${filename}`;
            
            fileUrl = await uploadToFileServer(file, finalFilename, "resources");
        } catch (error) {
            console.error(error);
            return { success: false, error: "Failed to upload file" };
        }
    } else {
        return { success: false, error: "Please provide a file or a link" };
    }

    await prisma.resource.create({
      data: {
        title,
        fileUrl
      }
    });

    revalidatePath("/resources");
    return { success: true };

  } catch (error) {
    console.error("Create Resource Error:", error);
    return { success: false, error: "Failed to create resource" };
  }
}

export async function deleteResource(id: string) {
  try {
    await prisma.resource.delete({
      where: { id }
    });
    revalidatePath("/resources");
    return { success: true };
  } catch (error) {
    console.error("Delete Resource Error:", error);
    return { success: false, error: "Failed to delete" };
  }
}
