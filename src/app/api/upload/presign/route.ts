import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
    buildUploadKey,
    buildUploadUrl,
    getFileServerUploadHeaders,
    getPublicFileUrl,
} from "@/lib/fileServer";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from "@/lib/uploadLimits";

type PresignPayload = {
    folder?: string;
    filename?: string;
};

type PresignResponseSuccess = {
    success: true;
    key: string;
    uploadUrl: string;
    method: string;
    headers: Record<string, string>;
    publicUrl: string | null;
    maxUploadBytes: number;
    maxUploadMb: number;
};

type PresignResponseError = {
    success: false;
    error: string;
};

type PresignResponse = PresignResponseSuccess | PresignResponseError;

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json<PresignResponse>(
            { success: false, error: "Unauthorized" },
            { status: 401 }
        );
    }

    let payload: PresignPayload = {};
    try {
        payload = (await request.json()) as PresignPayload;
    } catch {
        // Empty bodies are allowed
    }

    const folder = (payload.folder?.trim() || "uploads").slice(0, 128);
    const filenameInput = payload.filename?.trim();
    const filename = filenameInput && filenameInput.length > 0 ? filenameInput : `upload-${Date.now()}`;

    try {
        const key = buildUploadKey(filename, folder);
        const uploadUrl = buildUploadUrl(key);
        const publicUrl = getPublicFileUrl(key);
        const headers = getFileServerUploadHeaders();

        return NextResponse.json<PresignResponse>({
            success: true,
            key,
            uploadUrl,
            method: "PUT",
            headers,
            publicUrl,
            maxUploadBytes: MAX_UPLOAD_BYTES,
            maxUploadMb: MAX_UPLOAD_MB,
        });
    } catch (error) {
        console.error("Failed to prepare upload target", error);
        return NextResponse.json<PresignResponse>(
            { success: false, error: "Unable to prepare upload" },
            { status: 500 }
        );
    }
}
