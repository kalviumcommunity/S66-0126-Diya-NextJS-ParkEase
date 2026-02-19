import { NextRequest, NextResponse } from 'next/server';
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
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: userId, slotId, startTime, endTime',
        },
        { status: 400 }
      );
    }

    // Parse dates
    const parsedStartTime = new Date(startTime);
    const parsedEndTime = new Date(endTime);

    if (isNaN(parsedStartTime.getTime()) || isNaN(parsedEndTime.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date format. Use ISO 8601 format (e.g., 2026-02-20T10:00:00Z)',
        },
        { status: 400 }
      );
    }

    const result = await bookParkingSlot({
      userId,
      slotId,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 409 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
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

      return NextResponse.json(
        {
          success: true,
          message: 'Get user bookings',
          data: {
            userId,
            bookings: [],
            total: 0,
            message: 'TODO: Implement user bookings retrieval',
          },
        },
        { status: 200 }
      );
    }

    // Mode 2: Check availability
    if (!slotId || !startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing required query parameters. Use either userId OR (slotId, startTime, endTime)',
        },
        { status: 400 }
      );
    }

    const parsedStartTime = new Date(startTime);
    const parsedEndTime = new Date(endTime);

    if (isNaN(parsedStartTime.getTime()) || isNaN(parsedEndTime.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date format. Use ISO 8601 format',
        },
        { status: 400 }
      );
    }

    const available = await isSlotAvailable(slotId, parsedStartTime, parsedEndTime);

    return NextResponse.json({
      success: true,
      slotId,
      startTime: parsedStartTime.toISOString(),
      endTime: parsedEndTime.toISOString(),
      available,
    });
  } catch (error) {
    console.error('Availability check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
