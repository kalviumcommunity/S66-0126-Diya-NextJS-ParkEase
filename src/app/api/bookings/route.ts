import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { bookParkingSlot, isSlotAvailable } from '@/lib/bookingService';

/**
 * POST /api/bookings - Create a new booking
 *
 * Request body:
 * {
 *   "userId": "user-id",
 *   "slotId": "slot-id",
 *   "startTime": "2026-02-20T10:00:00Z",
 *   "endTime": "2026-02-20T12:00:00Z"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, slotId, startTime, endTime } = body;

    if (!userId || !slotId || !startTime || !endTime) {
      return errorResponse(
        'Missing required fields: userId, slotId, startTime, endTime',
        400,
        'MISSING_FIELDS'
      );
    }

    // Parse dates
    const parsedStartTime = new Date(startTime);
    const parsedEndTime = new Date(endTime);

    if (isNaN(parsedStartTime.getTime()) || isNaN(parsedEndTime.getTime())) {
      return errorResponse(
        'Invalid date format. Use ISO 8601 format (e.g., 2026-02-20T10:00:00Z)',
        400,
        'INVALID_DATE'
      );
    }

    const result = await bookParkingSlot({
      userId,
      slotId,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
    });

    if (!result.success) {
      return errorResponse(result.error || 'Booking failed', 409, 'BOOKING_FAILED');
    }

    return successResponse(result, 201);
  } catch (error) {
    console.error('Booking error:', error);
    return errorResponse('Internal server error', 500);
  }
}

/**
 * GET /api/bookings
 * Two modes:
 * 1. Get user's bookings: GET /api/bookings?userId=xxx (requires auth)
 * 2. Check availability: GET /api/bookings?slotId=xxx&startTime=xxx&endTime=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const slotId = searchParams.get('slotId');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    // Mode 1: Get user's bookings
    if (userId && !slotId) {
      // TODO: Implement get user bookings logic
      // - Verify authentication and ensure userId matches current user (or is admin)
      // - Query all bookings for the user
      // - Filter by status if needed
      // - Return paginated list of user's bookings

      return successResponse(
        {
          userId,
          bookings: [],
          total: 0,
          message: 'TODO: Implement user bookings retrieval',
        },
        200
      );
    }

    // Mode 2: Check availability
    if (!slotId || !startTime || !endTime) {
      return errorResponse(
        'Missing required query parameters. Use either userId OR (slotId, startTime, endTime)',
        400,
        'MISSING_PARAMS'
      );
    }

    const parsedStartTime = new Date(startTime);
    const parsedEndTime = new Date(endTime);

    if (isNaN(parsedStartTime.getTime()) || isNaN(parsedEndTime.getTime())) {
      return errorResponse('Invalid date format. Use ISO 8601 format', 400, 'INVALID_DATE');
    }

    const available = await isSlotAvailable(slotId, parsedStartTime, parsedEndTime);

    return successResponse(
      {
        slotId,
        startTime: parsedStartTime.toISOString(),
        endTime: parsedEndTime.toISOString(),
        available,
      },
      200
    );
  } catch (error) {
    console.error('Availability check error:', error);
    return errorResponse('Internal server error', 500);
  }
}
