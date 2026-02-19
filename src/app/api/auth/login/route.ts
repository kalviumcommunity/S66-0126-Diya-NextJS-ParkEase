import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/apiResponse';

/**
 * POST /api/auth/login
 * Authenticate user and return JWT tokens
 *
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "password123"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse('Missing required fields: email, password', 400, 'MISSING_FIELDS');
    }

    // TODO: Implement actual authentication logic
    // - Find user by email
    // - Verify password hash with bcryptjs
    // - Generate JWT access token (15 mins)
    // - Generate JWT refresh token (7 days)
    // - Set secure HTTP-only cookies
    // - Return tokens and user info

    return successResponse(
      {
        userId: 'user-123',
        email,
        accessToken: 'jwt-access-token-here',
        refreshToken: 'jwt-refresh-token-here',
        message: 'TODO: Implement login logic',
      },
      200
    );
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Internal server error', 500);
  }
}
