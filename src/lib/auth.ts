import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { errorResponse } from './apiResponse';

/**
 * User payload attached to authenticated requests
 */
export interface AuthUser {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

/**
 * Extended NextRequest with user property
 */
export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
}

/**
 * Middleware function type for authenticated routes
 */
export type AuthenticatedHandler<P extends Record<string, string> = Record<string, string>> = (
  request: AuthenticatedRequest,
  context?: { params: Promise<P> }
) => Promise<NextResponse<any>>;

/**
 * Authenticate middleware - Verifies JWT access token from Authorization header
 *
 * Usage:
 * ```typescript
 * export const GET = authenticate(async (req: AuthenticatedRequest) => {
 *   const user = req.user; // Available after authentication
 *   // ... route logic
 * });
 * ```
 *
 * @param handler - The route handler function to wrap
 * @returns Wrapped handler with authentication
 */
export function authenticate<P extends Record<string, string> = Record<string, string>>(
  handler: AuthenticatedHandler<P>
): AuthenticatedHandler<P> {
  return async (
    request: AuthenticatedRequest,
    context?: { params: Promise<P> }
  ) => {
    try {
      // Extract token from Authorization header
      const authHeader = request.headers.get('authorization');

      if (!authHeader) {
        return errorResponse('Authorization header is required', 401, 'UNAUTHORIZED');
      }

      // Check for Bearer token format
      if (!authHeader.startsWith('Bearer ')) {
        return errorResponse(
          'Invalid authorization format. Use: Bearer <token>',
          401,
          'INVALID_TOKEN_FORMAT'
        );
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      if (!token) {
        return errorResponse('Access token is required', 401, 'TOKEN_MISSING');
      }

      // Get JWT secret from environment
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error('JWT_SECRET not configured');
        return errorResponse('Authentication configuration error', 500);
      }

      // Verify JWT token
      try {
        const decoded = jwt.verify(token, jwtSecret) as AuthUser;

        // Attach user to request object
        request.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };

        // Call the original handler with authenticated request
        return await handler(request, context);
      } catch (jwtError) {
        if (jwtError instanceof jwt.TokenExpiredError) {
          return errorResponse('Access token has expired', 401, 'TOKEN_EXPIRED');
        }
        if (jwtError instanceof jwt.JsonWebTokenError) {
          return errorResponse('Invalid access token', 401, 'INVALID_TOKEN');
        }
        throw jwtError;
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return errorResponse('Authentication failed', 500);
    }
  };
}

/**
 * Authorize middleware - Checks if authenticated user has required role(s)
 *
 * Must be used after authenticate middleware
 *
 * Usage:
 * ```typescript
 * export const PUT = authenticate(authorize(['ADMIN'], async (req: AuthenticatedRequest) => {
 *   // Only ADMIN users can reach here
 *   // ... route logic
 * }));
 * ```
 *
 * @param requiredRoles - Array of roles that are allowed to access the route
 * @param handler - The route handler function to wrap
 * @returns Wrapped handler with authorization check
 */
export function authorize<P extends Record<string, string> = Record<string, string>>(
  requiredRoles: Array<'USER' | 'ADMIN'>,
  handler: AuthenticatedHandler<P>
): AuthenticatedHandler<P> {
  return async (
    request: AuthenticatedRequest,
    context?: { params: Promise<P> }
  ) => {
    try {
      // Check if user is attached (should be done by authenticate middleware)
      if (!request.user) {
        return errorResponse('User not authenticated', 401, 'UNAUTHORIZED');
      }

      // Check if user has required role
      if (!requiredRoles.includes(request.user.role)) {
        return errorResponse(
          `Access denied. Required role: ${requiredRoles.join(' or ')}`,
          403,
          'FORBIDDEN'
        );
      }

      // User is authorized, call the handler
      return await handler(request, context);
    } catch (error) {
      console.error('Authorization error:', error);
      return errorResponse('Authorization check failed', 500);
    }
  };
}

/**
 * Helper function to combine authenticate and authorize
 *
 * Usage:
 * ```typescript
 * export const PUT = withAuth(['ADMIN'], async (req: AuthenticatedRequest) => {
 *   // Authenticated and authorized
 *   const user = req.user;
 *   // ... route logic
 * });
 * ```
 */
export function withAuth<P extends Record<string, string> = Record<string, string>>(
  requiredRoles: Array<'USER' | 'ADMIN'>,
  handler: AuthenticatedHandler<P>
): AuthenticatedHandler<P> {
  return authenticate(authorize(requiredRoles, handler));
}
