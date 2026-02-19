import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { loginSchema } from '@/lib/validations/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

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

    // Validate request body
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.issues
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      return errorResponse(errors, 400, 'VALIDATION_ERROR');
    }

    const { email, password } = validation.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return errorResponse('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return errorResponse('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Get JWT secrets from environment
    const jwtSecret = process.env.JWT_SECRET;
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

    if (!jwtSecret || !refreshTokenSecret) {
      console.error('JWT secrets not configured');
      return errorResponse('Authentication configuration error', 500);
    }

    // Generate JWT access token (expires in 15 minutes)
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: '15m' }
    );

    // Generate JWT refresh token (expires in 7 days)
    const refreshToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      refreshTokenSecret,
      { expiresIn: '7d' }
    );

    // Set refresh token as HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });

    // Return access token in response body
    return successResponse(
      {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        expiresIn: 900, // 15 minutes in seconds
      },
      200
    );
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Internal server error', 500);
  }
}
