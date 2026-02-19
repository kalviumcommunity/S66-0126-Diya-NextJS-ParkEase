import { successResponse } from '@/lib/apiResponse';
import { authenticate, AuthenticatedRequest } from '@/lib/auth';

/**
 * GET /api/auth/me
 * Get current authenticated user information
 *
 * Authorization:
 * - Requires valid JWT access token
 * - Available to all authenticated users (USER and ADMIN)
 */
export const GET = authenticate(async (request: AuthenticatedRequest) => {
  try {
    // User is automatically attached by authenticate middleware
    const user = request.user;

    return successResponse(
      {
        user: {
          userId: user?.userId,
          email: user?.email,
          role: user?.role,
        },
        message: 'User authenticated successfully',
      },
      200
    );
  } catch (error) {
    console.error('Get user info error:', error);
    return successResponse({ error: 'Internal server error' }, 500);
  }
});
