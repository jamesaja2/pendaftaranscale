import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Supabase S3 Configuration
const s3Client = new S3Client({
    region: process.env.S3_REGION || "ap-southeast-1",
    endpoint: process.env.S3_ENDPOINT || "https://uhodcquzbfoytkkwfpdj.storage.supabase.co/storage/v1/s3",
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "",
        secretAccessKey: process.env.S3_SECRET_KEY || "",
    },
    forcePathStyle: true, // Supabase usually requires this or auto-detects
});

const BUCKET_NAME = process.env.S3_BUCKET || 'scalekopsis';

// Helper to ensure bucket exists
// Note: We assume the bucket is managed via Supabase UI
let bucketChecked = false;

async function ensureBucket() {
    if (bucketChecked) return;
    try {
        await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
        bucketChecked = true;
    } catch (error) {
        console.error(`Bucket ${BUCKET_NAME} check failed. Ensure it exists in Supabase.`, error);
    }
}

export async function uploadToMinio(file: File | Buffer, filename: string, folder: string = ''): Promise<string> {
    const buffer = Buffer.isBuffer(file) ? file : Buffer.from(await (file as File).arrayBuffer());
    // Detect MetaData (ContentType) if possible
    const contentType = (file as any).type || 'application/octet-stream';
    
    // Ensure filename is clean
    const cleanFilename = filename.replace(/\s+/g, '-');
    const objectName = folder ? `${folder}/${cleanFilename}` : cleanFilename;

    try {
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: objectName,
            Body: buffer,
            ContentType: contentType,
        }));
        
        return objectName;
    } catch (error) {
        console.error("Supabase S3 Upload Error:", error);
        throw new Error("Failed to upload to storage");
    }
}

export async function getPresignedUrl(objectName: string): Promise<string> {
    try {
        if (!objectName) return "";
        let key = objectName;

        // Handle legacy full URLs if necessary
        if (objectName.startsWith("http")) {
            try {
                const url = new URL(objectName);
                const pathParts = url.pathname.split('/');
                // Logic to extract Key from Supabase URL if stored as URL
                // e.g. /storage/v1/s3/bucket/folder/file OR /bucket/folder/file
                // We'll search for bucket name index
                const bucketIndex = pathParts.indexOf(BUCKET_NAME);
                if (bucketIndex >= 0 && bucketIndex < pathParts.length - 1) {
                    key = pathParts.slice(bucketIndex + 1).join('/');
                }
            } catch (e) { /* ignore */ }
        }

        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });
        
        // Expires in 7 days (64800s is 18 hours? minio used 604800 for 7 days)
        // Set to 7 days = 604800
        return await getSignedUrl(s3Client, command, { expiresIn: 604800 });
    } catch (error) {
        console.error("Presign Error:", error);
        return "";
    }
}

export async function deleteFromMinio(objectName: string) {
    try {
        let key = objectName;
        // Logic to extract key if full URL passed
        if (objectName.startsWith("http")) {
            try {
                const url = new URL(objectName);
                const pathParts = url.pathname.split('/');
                const bucketIndex = pathParts.indexOf(BUCKET_NAME);
                if (bucketIndex >= 0 && bucketIndex < pathParts.length - 1) {
                    key = pathParts.slice(bucketIndex + 1).join('/');
                }
            } catch(e) {}
        }

        await s3Client.send(new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        }));
    } catch (error) {
        console.error("Delete Error:", error);
    }
}
