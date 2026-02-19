import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/bookingService';

/**
 * GET /api/bookings/available?startTime=xxx&endTime=xxx
 * Get all available slots for a given time period
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    if (!startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required query parameters: startTime, endTime',
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

    if (parsedStartTime >= parsedEndTime) {
      return NextResponse.json(
        {
          success: false,
          error: 'Start time must be before end time',
        },
        { status: 400 }
      );
    }

    const slots = await getAvailableSlots(parsedStartTime, parsedEndTime);

    return NextResponse.json({
      success: true,
      startTime: parsedStartTime.toISOString(),
      endTime: parsedEndTime.toISOString(),
      availableCount: slots.length,
      slots: slots.map((slot) => ({
        id: slot.id,
        row: slot.row,
        column: slot.column,
        status: slot.status,
      })),
    });
  } catch (error) {
    console.error('Available slots error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
