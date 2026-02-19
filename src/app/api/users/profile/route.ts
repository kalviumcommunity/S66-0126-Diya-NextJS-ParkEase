import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { deleteFile } from '@/lib/s3';
import { withErrorHandler } from '@/lib/errorHandler';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

// Validation schema for profile update
const profileUpdateSchema = z.object({
  profilePictureUrl: z.string().url().optional(),
  profilePictureKey: z.string().optional(),
  name: z.string().min(1).max(255).optional(),
});

type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

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
 * GET /api/users/profile
 * Get current user's profile
 *
 * Authentication: Required
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Get user from JWT
  const user = getUserFromRequest(request);
  if (!user) {
    return errorResponse('Unauthorized', 401);
  }

  // Fetch user profile
  const userProfile = await prisma.user.findUnique({
    where: { id: user.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      profilePictureUrl: true,
      profilePictureKey: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!userProfile) {
    return errorResponse('User not found', 404);
  }

  return successResponse(userProfile);
});

/**
 * PUT /api/users/profile
 * Update user profile including profile picture URL after S3 upload
 *
 * Authentication: Required
 *
 * Request body:
 * {
 *   "profilePictureUrl": "https://parkease-uploads.s3.us-east-1.amazonaws.com/...",
 *   "profilePictureKey": "profile-pictures/1708372800000-abc123def-profile.jpg",
 *   "name": "John Doe"
 * }
 *
 * Response (200 OK):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "user-uuid",
 *     "email": "user@parkease.com",
 *     "name": "John Doe",
 *     "role": "USER",
 *     "profilePictureUrl": "https://...",
 *     "profilePictureKey": "profile-pictures/...",
 *     "updatedAt": "2026-02-20T12:00:00Z"
 *   }
 * }
 */
export const PUT = withErrorHandler(async (request: NextRequest) => {
  // Get user from JWT
  const user = getUserFromRequest(request);
  if (!user) {
    return errorResponse('Unauthorized', 401);
  }

  // Parse and validate request body
  const body = await request.json();
  const validationResult = profileUpdateSchema.safeParse(body);

  if (!validationResult.success) {
    const errorMessages = validationResult.error.issues.map((issue) => issue.message).join(', ');
    return errorResponse(`Validation failed: ${errorMessages}`, 400);
  }

  const { profilePictureUrl, profilePictureKey, name } = validationResult.data as ProfileUpdate;

  try {
    // If updating profile picture, delete the old one if it exists
    if (profilePictureUrl && profilePictureKey) {
      const currentUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { profilePictureKey: true },
      });

      // Delete old profile picture from S3 if it exists
      if (currentUser?.profilePictureKey) {
        try {
          await deleteFile(currentUser.profilePictureKey);
          console.log(`Deleted old profile picture: ${currentUser.profilePictureKey}`);
        } catch (error) {
          // Log but don't fail if old file deletion fails
          console.warn(`Failed to delete old profile picture: ${error}`);
        }
      }
    }

    // Update user profile
    const updateData: {
      profilePictureUrl?: string | null;
      profilePictureKey?: string | null;
      name?: string;
    } = {};

    if (profilePictureUrl !== undefined) {
      updateData.profilePictureUrl = profilePictureUrl || null;
    }
    if (profilePictureKey !== undefined) {
      updateData.profilePictureKey = profilePictureKey || null;
    }
    if (name !== undefined) {
      updateData.name = name;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profilePictureUrl: true,
        profilePictureKey: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(`Updated profile for user ${user.userId}`);

    return successResponse(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
});
