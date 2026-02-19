import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { generateUploadUrl } from '@/lib/s3';
import { withErrorHandler } from '@/lib/errorHandler';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

// Validation schema for upload request
const uploadRequestSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().refine(
    (type) => {
      // Only allow image uploads for profile pictures
      return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(type);
    },
    { message: 'Only JPEG, PNG, WebP, and GIF images are allowed' }
  ),
  expiresIn: z.number().int().min(300).max(86400).optional().default(3600), // 5 min to 24 hours
});

type UploadRequest = z.infer<typeof uploadRequestSchema>;

/**
 * Extract user from JWT token
 */
function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      userId: string;
      email: string;
      role: 'USER' | 'ADMIN';
    };
    return decoded;
  } catch {
    return null;
  }
}

/**
 * POST /api/upload
 * Generate a pre-signed URL for uploading a profile picture to S3
 * Client will use this URL to PUT the file directly to S3
 *
 * Authentication: Required (user must be logged in)
 * Rate limit: Recommended - 1 request per 5 minutes per user
 *
 * Request body:
 * {
 *   "fileName": "profile.jpg",
 *   "contentType": "image/jpeg",
 *   "expiresIn": 3600  // optional, default 1 hour
 * }
 *
 * Response (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "uploadUrl": "https://parkease-uploads.s3.us-east-1.amazonaws.com/...",
 *     "fileKey": "profile-pictures/1708372800000-abc123def-profile.jpg",
 *     "bucket": "parkease-uploads",
 *     "expiresIn": 3600
 *   }
 * }
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Get user from JWT
  const user = getUserFromRequest(request);
  if (!user) {
    return errorResponse('Unauthorized', 401);
  }

  // Parse and validate request body
  const body = await request.json();
  const validationResult = uploadRequestSchema.safeParse(body);

  if (!validationResult.success) {
    const errorMessages = validationResult.error.issues.map((issue) => issue.message).join(', ');
    return errorResponse(`Validation failed: ${errorMessages}`, 400);
  }

  const { fileName, contentType, expiresIn } = validationResult.data as UploadRequest;

  try {
    // Generate pre-signed URL
    const uploadData = await generateUploadUrl(fileName, contentType, expiresIn);

    console.log(`Generated upload URL for user ${user.userId}: ${uploadData.fileKey}`);

    return successResponse(uploadData);
  } catch (error) {
    console.error('Error generating upload URL:', error);
    throw error;
  }
});
