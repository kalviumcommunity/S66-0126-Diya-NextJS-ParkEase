import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'parkease-uploads';

/**
 * Generate a pre-signed URL for uploading a file to S3
 * Client can then use this URL to PUT the file directly
 *
 * @param fileName - Name of the file to upload
 * @param contentType - MIME type of the file
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Object with pre-signed URL, bucket, and key
 */
export async function generateUploadUrl(
  fileName: string,
  contentType: string,
  expiresIn: number = 3600
) {
  try {
    // Create a unique file key using timestamp and random string
    const fileKey = `profile-pictures/${Date.now()}-${Math.random().toString(36).substring(7)}-${fileName}`;

    // Create PutObject command with metadata
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
      Metadata: {
        'upload-timestamp': new Date().toISOString(),
      },
    });

    // Generate pre-signed URL
    const url = await getSignedUrl(s3Client, command, { expiresIn });

    return {
      uploadUrl: url,
      bucket: BUCKET_NAME,
      fileKey,
      expiresIn,
    };
  } catch (error) {
    console.error('Error generating upload URL:', error);
    throw new Error('Failed to generate upload URL');
  }
}

/**
 * Generate a public URL for accessing a file from S3
 * (assumes file is in a public bucket or has public read permissions)
 *
 * @param fileKey - S3 object key
 * @returns Public URL to the file
 */
export function getPublicUrl(fileKey: string): string {
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileKey}`;
}

/**
 * Generate a pre-signed download URL for accessing a file from S3
 * Useful for private buckets
 *
 * @param fileKey - S3 object key
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Pre-signed download URL
 */
export async function generateDownloadUrl(fileKey: string, expiresIn: number = 3600) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Error generating download URL:', error);
    throw new Error('Failed to generate download URL');
  }
}

/**
 * Delete a file from S3
 *
 * @param fileKey - S3 object key
 */
export async function deleteFile(fileKey: string) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    await s3Client.send(command);
    console.log(`Deleted file: ${fileKey}`);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
}

/**
 * Extract file key from a public S3 URL
 * Useful for deleting old profile pictures
 *
 * @param url - Public S3 URL
 * @returns File key or null if URL doesn't match bucket
 */
export function extractFileKeyFromUrl(url: string): string | null {
  const bucketUrl = `https://${BUCKET_NAME}.s3.`;
  if (!url.startsWith(bucketUrl)) {
    return null;
  }

  // Extract everything after the bucket domain
  const parts = url.split(bucketUrl);
  if (parts.length < 2) {
    return null;
  }

  // Extract key from URL (remove region and get path)
  const keyPart = parts[1];
  const keyMatch = keyPart.match(/amazonaws\.com\/(.*)/);
  return keyMatch ? keyMatch[1] : null;
}

export default s3Client;
