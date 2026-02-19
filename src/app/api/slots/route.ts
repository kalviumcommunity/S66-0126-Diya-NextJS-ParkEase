import { NextRequest } from 'next/server';
import { errorResponse, paginatedResponse } from '@/lib/apiResponse';

/**
 * GET /api/slots?status=AVAILABLE&row=1&column=5
 * List all parking slots with optional filters
 *
 * Query parameters:
 * - status: AVAILABLE | OCCUPIED | RESERVED | MAINTENANCE
 * - row: Filter by row number
 * - column: Filter by column number
 * - limit: Number of results (default 50)
 * - offset: Pagination offset (default 0)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const _status = searchParams.get('status');
    const _row = searchParams.get('row');
    const _column = searchParams.get('column');
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    // TODO: Implement slot listing logic
    // - Query database with filters
    // - Apply pagination
    // - Return slots with status and location info

    return paginatedResponse(
      [
        {
          id: 'slot-1',
          row: 1,
          column: 1,
          status: 'AVAILABLE',
        },
        {
          id: 'slot-2',
          row: 1,
          column: 2,
          status: 'OCCUPIED',
        },
      ],
      50,
      parseInt(limit),
      parseInt(offset),
      200
    );
  } catch (error) {
    console.error('Get slots error:', error);
    return errorResponse('Internal server error', 500);
  }
}
