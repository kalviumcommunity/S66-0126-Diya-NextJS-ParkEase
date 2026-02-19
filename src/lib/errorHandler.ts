import { NextResponse } from 'next/server';
import { errorResponse } from './apiResponse';

/**
 * Custom error class for API errors with status codes
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Error handler response interface
 */
interface ErrorDetails {
  message: string;
  code?: string;
  stack?: string;
  details?: unknown;
}

/**
 * Global error handler for API routes
 *
 * Catches any thrown errors and returns a formatted error response.
 * In development: includes stack trace
 * In production: suppresses stack trace for security
 *
 * @param error - The error object caught in catch block
 * @param context - Optional context information for debugging
 * @returns NextResponse with formatted error
 */
export function errorHandler(error: unknown, context?: string): NextResponse {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Log error for debugging
  console.error('=== API Error Handler ===');
  if (context) {
    console.error(`Context: ${context}`);
  }
  console.error('Error:', error);

  // Handle ApiError (custom errors with status codes)
  if (error instanceof ApiError) {
    const errorDetails: ErrorDetails = {
      message: error.message,
      code: error.code || 'API_ERROR',
    };

    // Include stack trace in development
    if (isDevelopment && error.stack) {
      errorDetails.stack = error.stack;
    }

    return errorResponse(
      errorDetails.message,
      error.statusCode,
      errorDetails.code,
      isDevelopment ? { stack: errorDetails.stack } : undefined
    );
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: unknown };

    // Prisma error codes: https://www.prisma.io/docs/reference/api-reference/error-reference
    switch (prismaError.code) {
      case 'P2002':
        return errorResponse('A record with this value already exists', 409, 'DUPLICATE_ENTRY');
      case 'P2025':
        return errorResponse('Record not found', 404, 'NOT_FOUND');
      case 'P2003':
        return errorResponse('Foreign key constraint violation', 400, 'INVALID_REFERENCE');
      case 'P2014':
        return errorResponse('Invalid relation data', 400, 'INVALID_RELATION');
      default:
        if (isDevelopment) {
          return errorResponse(`Database error: ${prismaError.code}`, 500, 'DATABASE_ERROR', {
            prismaCode: prismaError.code,
            meta: prismaError.meta,
          });
        }
        return errorResponse('Database operation failed', 500, 'DATABASE_ERROR');
    }
  }

  // Handle standard JavaScript errors
  if (error instanceof Error) {
    const errorDetails: ErrorDetails = {
      message: isDevelopment ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
    };

    if (isDevelopment && error.stack) {
      errorDetails.stack = error.stack;
    }

    return errorResponse(
      errorDetails.message,
      500,
      errorDetails.code,
      isDevelopment ? { stack: errorDetails.stack } : undefined
    );
  }

  // Handle unknown error types
  return errorResponse(
    isDevelopment ? `Unknown error: ${String(error)}` : 'Internal server error',
    500,
    'UNKNOWN_ERROR',
    isDevelopment ? { error: String(error) } : undefined
  );
}

/**
 * Async wrapper for route handlers that automatically catches errors
 *
 * Usage:
 * ```typescript
 * export const POST = withErrorHandler(async (request: NextRequest) => {
 *   // Your route logic here
 *   // Any thrown errors will be caught and handled
 * }, 'POST /api/your-route');
 * ```
 *
 * @param handler - The async route handler function
 * @param context - Optional context string for error logging (e.g., route name)
 * @returns Wrapped handler with error handling
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  context?: string
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorHandler(error, context);
    }
  }) as T;
}

/**
 * Helper to throw an API error with custom status code
 *
 * Usage:
 * ```typescript
 * if (!user) {
 *   throw new ApiError('User not found', 404, 'USER_NOT_FOUND');
 * }
 * ```
 */
export function throwApiError(message: string, statusCode: number = 500, code?: string): never {
  throw new ApiError(message, statusCode, code);
}

/**
 * Type guard to check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
