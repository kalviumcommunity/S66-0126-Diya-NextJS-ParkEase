import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/apiResponse';
import { withErrorHandler, ApiError } from '@/lib/errorHandler';

/**
 * GET /api/test/error
 * Test endpoint to demonstrate error handling
 *
 * Query params:
 * - type: 'api' | 'standard' | 'prisma' | 'unknown' (default: 'api')
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const errorType = searchParams.get('type') || 'api';

  switch (errorType) {
    case 'api':
      // Throw custom ApiError with status code
      throw new ApiError('This is a custom API error', 400, 'CUSTOM_ERROR');

    case 'standard':
      // Throw standard JavaScript error
      throw new Error('This is a standard JavaScript error');

    case 'prisma':
      // Simulate Prisma error
      throw {
        code: 'P2025',
        meta: { cause: 'Record to update not found.' },
      };

    case 'unknown':
      // Throw unknown error type
      throw 'This is an unknown error type';

    case 'success':
      // Normal successful response
      return successResponse(
        {
          message: 'Error test endpoint working correctly',
          availableErrorTypes: ['api', 'standard', 'prisma', 'unknown', 'success'],
        },
        200
      );

    default:
      throw new ApiError(`Unknown error type: ${errorType}`, 400, 'INVALID_TYPE');
  }
}, 'GET /api/test/error');
