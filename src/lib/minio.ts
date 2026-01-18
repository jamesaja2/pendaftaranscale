import * as Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || '',
  secretKey: process.env.MINIO_SECRET_KEY || '',
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'scalekopsis';

// Helper to ensure bucket exists and is public
let bucketChecked = false;

async function ensureBucket() {
    if (bucketChecked) return;
    try {
        const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
        if(!bucketExists) {
            await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
            const policy = {
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Principal: { AWS: ["*"] },
                        Action: ["s3:GetObject"],
                        Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
                    }
                ]
            };
            await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
            console.log(`Bucket ${BUCKET_NAME} created and set to public.`);
        }
        bucketChecked = true;
    } catch (error) {
        console.error("Error ensuring bucket exists:", error);
    }
}

export async function uploadToMinio(file: File | Buffer, filename: string, folder: string = ''): Promise<string> {
    await ensureBucket();

    // Use Buffer directly from Buffer or await arrayBuffer for File
    const buffer = Buffer.isBuffer(file) ? file : Buffer.from(await (file as File).arrayBuffer());
    const size = buffer.length;

    // Detect MetaData (ContentType) if possible
    const metaData = {
        'Content-Type': (file as any).type || 'application/octet-stream',
    };
    
    // Ensure filename is clean
    const cleanFilename = filename.replace(/\s+/g, '-');
    const objectName = folder ? `${folder}/${cleanFilename}` : cleanFilename;

    await minioClient.putObject(BUCKET_NAME, objectName, buffer, size, metaData);

    // Return the object name (Key) to be stored in DB
    // We will generate Presigned URLs for access since the bucket is private
    return objectName;
}

export async function getPresignedUrl(objectName: string): Promise<string> {
    await ensureBucket();
    try {
        // Jika objectName adalah full URL (legacy), kita coba ambil key-nya
        if (objectName.startsWith('http')) {
            const url = new URL(objectName);
            const pathParts = url.pathname.split('/');
            // format: /bucketName/folder/file
            // kita butuh folder/file.
            // pathParts[0] is empty, [1] is bucket
            objectName = pathParts.slice(2).join('/');
        }

        // Generate URL valid for 7 days (604800 seconds)
        return await minioClient.presignedGetObject(BUCKET_NAME, objectName, 24*60*60);
    } catch (error) {
        console.error("Error generating presigned URL:", error);
        return "";
    }
}

export async function deleteFromMinio(objectName: string) {
    await ensureBucket();
    try {
        await minioClient.removeObject(BUCKET_NAME, objectName);
    } catch (error) {
        console.error("MinIO Delete Error:", error);
    }
}
