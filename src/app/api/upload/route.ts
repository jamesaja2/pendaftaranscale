import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToFileServer, getPublicFileUrl } from "@/lib/fileServer";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from "@/lib/uploadLimits";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const folder = (formData.get("folder") as string) || "uploads";
  const desiredName = (formData.get("filename") as string) || undefined;

  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: "Missing file" }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { success: false, error: `File exceeds ${MAX_UPLOAD_MB}MB limit` },
      { status: 400 }
    );
  }

  try {
    const filename = desiredName || file.name || `upload-${Date.now()}`;
    const key = await uploadToFileServer(file, filename, folder);
    const url = getPublicFileUrl(key);
    return NextResponse.json({ success: true, key, url });
  } catch (error) {
    console.error("Upload proxy failed", error);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
