import { successResponse, errorResponse } from '@/lib/apiResponse';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { withErrorHandler } from '@/lib/errorHandler';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/auth/refresh
 * Refresh the access token using the refresh token from HTTP-only cookie
 */
export const POST = withErrorHandler(async () => {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;

  if (!refreshToken) {
    return errorResponse('Refresh token not found', 401, 'NO_REFRESH_TOKEN');
  }

  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
  const jwtSecret = process.env.JWT_SECRET;

  if (!refreshTokenSecret || !jwtSecret) {
    console.error('JWT secrets not configured');
    return errorResponse('Authentication configuration error', 500);
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, refreshTokenSecret) as {
      userId: string;
      email: string;
    };

    // Fetch fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return errorResponse('User not found', 401, 'USER_NOT_FOUND');
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: '15m' }
    );

    // Optionally generate new refresh token and rotate it
    const newRefreshToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      refreshTokenSecret,
      { expiresIn: '7d' }
    );

    // Set new refresh token as HTTP-only cookie
    const updatedCookieStore = await cookies();
    updatedCookieStore.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });

    return successResponse(
      {
        accessToken: newAccessToken,
        expiresIn: 900, // 15 minutes in seconds
      },
      200
    );
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return errorResponse('Refresh token has expired', 401, 'TOKEN_EXPIRED');
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return errorResponse('Invalid refresh token', 401, 'INVALID_TOKEN');
    }

    throw error;
  }
}, 'POST /api/auth/refresh');
