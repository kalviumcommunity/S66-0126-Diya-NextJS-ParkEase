import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { authenticate, AuthenticatedRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/bookings/[id]
 * Get a single booking by ID
 */
export const GET = authenticate(
  async (request: AuthenticatedRequest, context?: { params: Promise<{ id: string }> }) => {
    try {
      const params = await context?.params;
      const bookingId = params?.id;

      if (!bookingId) {
        return errorResponse('Booking ID is required', 400, 'MISSING_PARAM');
      }

      const user = request.user;
      if (!user) {
        return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          slot: {
            select: {
              id: true,
              row: true,
              column: true,
              status: true,
            },
          },
        },
      });

      if (!booking) {
        return errorResponse('Booking not found', 404, 'BOOKING_NOT_FOUND');
      }

      if (user.role !== 'ADMIN' && booking.userId !== user.userId) {
        return errorResponse('Forbidden', 403, 'FORBIDDEN');
      }

      return successResponse(
        {
          id: booking.id,
          slotId: booking.slotId,
          slot: booking.slot,
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
          status: booking.status,
          createdAt: booking.createdAt.toISOString(),
        },
        200
      );
    } catch (error) {
      console.error('Get booking error:', error);
      return errorResponse('Internal server error', 500);
    }
  }
);

/**
 * DELETE /api/bookings/[id]
 * Cancel a parking booking
 *
 * Path parameters:
 * - id: Booking ID (UUID)
 *
 * Authorization:
 * - Requires JWT token
 * - User can only cancel their own bookings (unless admin)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;

    if (!bookingId) {
      return errorResponse('Booking ID is required', 400, 'MISSING_PARAM');
    }

    // TODO: Implement booking cancellation logic
    // - Verify authentication and get user info from JWT
    // - Check if booking exists
    // - Verify user owns the booking (or is admin)
    // - Call cancelBooking service from bookingService.ts
    // - Return success response

    return successResponse(
      {
        bookingId,
        status: 'CANCELED',
        message: 'TODO: Implement booking cancellation with authorization',
      },
      200
    );
  } catch (error) {
    console.error('Cancel booking error:', error);
    return errorResponse('Internal server error', 500);
  }
}
