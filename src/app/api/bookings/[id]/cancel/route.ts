import { NextRequest, NextResponse } from 'next/server';
import { cancelBooking } from '@/lib/bookingService';

/**
 * PUT /api/bookings/[id]/cancel - Cancel a booking
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const bookingId = params.id;

    if (!bookingId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking ID is required',
        },
        { status: 400 }
      );
    }

    const result = await cancelBooking(bookingId);

    if (!result.success) {
      return NextResponse.json(result, { status: 409 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Cancel booking error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
