const FILE_SERVER_URL = (process.env.FILE_SERVER_URL || "").replace(/\/$/, "");
const FILE_SERVER_TOKEN = process.env.FILE_SERVER_TOKEN || "";

function ensureConfig() {
    if (!FILE_SERVER_URL) {
        throw new Error("FILE_SERVER_URL is not configured");
    }
    if (!FILE_SERVER_TOKEN) {
        throw new Error("FILE_SERVER_TOKEN is not configured");
    }
}

function sanitizeSegment(input: string, fallback = "segment") {
    const normalized = input
        .normalize("NFKD")
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
    return normalized || fallback;
}

function sanitizeFilename(filename: string) {
    return sanitizeSegment(filename, "file");
}

function buildKey(filename: string, folder?: string) {
    const cleanName = sanitizeFilename(filename);
    if (!folder) return cleanName;
    const cleanFolder = sanitizeSegment(folder, "bucket");
    return `${cleanFolder}--${cleanName}`;
}

function buildUrl(key: string) {
    const safeKey = key
        .split("/")
        .filter(Boolean)
        .map((segment) => encodeURIComponent(segment))
        .join("/");
    return `${FILE_SERVER_URL}/files/${safeKey}`;
}

async function toBlob(file: File | Buffer) {
    if (typeof File !== "undefined" && file instanceof File) {
        return file;
    }
    if (Buffer.isBuffer(file)) {
        return new Blob([new Uint8Array(file)]);
    }
    if ((file as any)?.arrayBuffer) {
        const data = await (file as File).arrayBuffer();
        return new Blob([data], { type: (file as any).type || "application/octet-stream" });
    }
    throw new Error("Unsupported file type");
}

export async function uploadToFileServer(file: File | Buffer, filename: string, folder = "") {
    ensureConfig();
    const key = buildKey(filename, folder);
    const formData = new FormData();
    const blob = await toBlob(file);
    formData.append("file", blob, key.split("/").pop());

    const response = await fetch(buildUrlForUpload(key), {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${FILE_SERVER_TOKEN}`,
        },
        body: formData,
    });

    if (!response.ok) {
        let message = "";
        try {
            message = await response.text();
        } catch (error) {
            console.warn("Failed to read file server error response", error);
        }
        throw new Error(`File server upload failed (${response.status} ${response.statusText}): ${message}`);
    }

    return key;
}

function buildUrlForUpload(key: string) {
    const safeKey = key
        .split("/")
        .filter(Boolean)
        .map((segment) => encodeURIComponent(segment))
        .join("/");
    return `${FILE_SERVER_URL}/files/${safeKey}`;
}

export async function deleteFromFileServer(key: string) {
    ensureConfig();
    if (!key) return;
    const response = await fetch(buildUrlForUpload(key), {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${FILE_SERVER_TOKEN}`,
        },
    });
    if (!response.ok) {
        console.warn("Failed to delete file server object", key, response.status);
    }
}

export function getPublicFileUrl(pathOrUrl: string | null | undefined) {
    if (!pathOrUrl) return null;
    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
        return pathOrUrl;
    }
    if (!FILE_SERVER_URL) {
        return pathOrUrl;
    }
    return buildUrl(pathOrUrl);
}

export function extractFileKey(pathOrUrl: string) {
    if (!pathOrUrl) return "";
    if (!pathOrUrl.startsWith("http")) {
        return pathOrUrl.replace(/^\/+/, "");
    }
    try {
        const url = new URL(pathOrUrl);
        const pathname = url.pathname.replace(/^\/files\//, "");
        return decodeURIComponent(pathname);
    } catch {
        return "";
    }
}
