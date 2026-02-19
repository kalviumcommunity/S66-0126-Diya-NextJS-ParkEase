import { NextResponse } from 'next/server';

/**
 * Standard API response structure
 */
export interface ApiResponse<T = Record<string, never>> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * Create a success response
 * @param data - Response data
 * @param statusCode - HTTP status code (default: 200)
 * @returns NextResponse with success structure
 */
export function successResponse<T>(
  data: T,
  statusCode: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status: statusCode }
  );
}

/**
 * Create an error response
 * @param message - Error message
 * @param statusCode - HTTP status code (default: 500)
 * @param code - Optional error code for client handling
 * @param details - Optional additional error details (e.g., stack trace in development)
 * @returns NextResponse with error structure
 */
export function errorResponse(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: unknown
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        ...(code && { code }),
        ...(details && { details }),
      },
    },
    { status: statusCode }
  );
}

/**
 * Create a paginated success response
 * @param data - Array of items
 * @param total - Total count of items
 * @param limit - Items per page
 * @param offset - Pagination offset
 * @param statusCode - HTTP status code (default: 200)
 * @returns NextResponse with paginated data
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  limit: number,
  offset: number,
  statusCode: number = 200
): NextResponse<
  ApiResponse<{
    items: T[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  }>
> {
  return NextResponse.json(
    {
      success: true,
      data: {
        items: data,
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    },
    { status: statusCode }
  );
}

/**
 * Helper function to safely handle try-catch in route handlers
 * @param fn - Async function to execute
 * @returns NextResponse with appropriate success/error response
 */
export async function handleAsync<T>(
  fn: () => Promise<{ success: boolean; data?: T; error?: string }>
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    const result = await fn();

    if (!result.success) {
      return errorResponse(result.error || 'Operation failed', 400);
    }

    return successResponse(result.data, 200);
  } catch (error) {
    console.error('API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
}
