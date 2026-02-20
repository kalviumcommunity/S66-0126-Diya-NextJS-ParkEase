import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { signupSchema } from '@/lib/validations/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail, getWelcomeEmailHtml } from '@/lib/email';
import bcrypt from 'bcryptjs';
import { withErrorHandler } from '@/lib/errorHandler';
import { sanitizeString } from '@/lib/sanitize';

/**
 * POST /api/auth/signup
 * Register a new user
 *
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "password123",
 *   "name": "John Doe"
 * }
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();

  // Validate request body
  const validation = signupSchema.safeParse(body);
  if (!validation.success) {
    const errors = validation.error.issues
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    return errorResponse(errors, 400, 'VALIDATION_ERROR');
  }

  const { email, password, name } = validation.data;
  const sanitizedName = sanitizeString(name);
  if (!sanitizedName) {
    return errorResponse('Name is required', 400, 'INVALID_NAME');
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return errorResponse('User with this email already exists', 409, 'USER_EXISTS');
  }

  // Hash password with bcrypt (10 rounds)
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user in database
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: sanitizedName,
      role: 'USER',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  // Send welcome email (fire and forget - don't block on email)
  try {
    const welcomeHtml = getWelcomeEmailHtml(user.name, user.email);
    await sendEmail(user.email, 'Welcome to ParkEase!', welcomeHtml);
    console.log(`Welcome email sent to ${user.email}`);
  } catch (error) {
    console.error(`Failed to send welcome email to ${user.email}:`, error);
    // Don't fail the signup if email fails - user is already created
  }

  return successResponse(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      message: 'User registered successfully',
    },
    201
  );
}, 'POST /api/auth/signup');
