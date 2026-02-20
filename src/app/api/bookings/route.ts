import { successResponse, errorResponse } from '@/lib/apiResponse';
import {
  bookParkingSlot,
  isSlotAvailable,
  completeExpiredBookings,
  markActiveBookingsAsOccupied,
} from '@/lib/bookingService';
import { createBookingSchema } from '@/lib/validations/booking';
import { invalidateCachePattern } from '@/lib/redis';
import { sendEmail, getBookingConfirmationEmailHtml } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/auth';

/**
 * POST /api/bookings - Create a new booking
 *
 * Request body:
 * {
 *   "slotId": "slot-id",
 *   "startTime": "2026-02-20T10:00:00Z",
 *   "endTime": "2026-02-20T12:00:00Z"
 * }
 */
export async function POST(request: AuthenticatedRequest) {
  return authenticate(async (authRequest: AuthenticatedRequest) => {
    try {
      const body = await authRequest.json();

      // Validate request body
      const validation = createBookingSchema.safeParse(body);
      if (!validation.success) {
        const errors = validation.error.issues
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        return errorResponse(errors, 400, 'VALIDATION_ERROR');
      }

      const user = authRequest.user;
      if (!user) {
        return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const { slotId, startTime, endTime } = validation.data;

      // Parse dates
      const parsedStartTime = new Date(startTime);
      const parsedEndTime = new Date(endTime);

      const result = await bookParkingSlot({
        userId: user.userId,
        slotId,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
      });

      if (!result.success) {
        return errorResponse(result.error || 'Booking failed', 409, 'BOOKING_FAILED');
      }

      // Invalidate slots cache after booking creation
      await invalidateCachePattern('slots:*');

      // Send booking confirmation email (fire and forget - don't block on email)
      try {
        const booking = result.booking;
        const slot = result.slot;
        const userRecord = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { email: true, name: true },
        });

        if (userRecord && booking && slot) {
          const confirmationHtml = getBookingConfirmationEmailHtml(userRecord.name, {
            bookingId: booking.id,
            slotLocation: 'Parking Location', // Could be enhanced with actual location data
            row: slot.row,
            column: slot.column,
            startTime: booking.startTime.toISOString(),
            endTime: booking.endTime.toISOString(),
          });

          await sendEmail(userRecord.email, 'Booking Confirmation', confirmationHtml);
          console.log(`Booking confirmation email sent to ${userRecord.email}`);
        }
      } catch (error) {
        console.error('Failed to send booking confirmation email:', error);
        // Don't fail the booking if email fails - booking is already created
      }

      return successResponse(result, 201);
    } catch (error) {
      console.error('Booking error:', error);
      return errorResponse('Internal server error', 500);
    }
  })(request);
}

/**
 * GET /api/bookings
 * Two modes:
 * 1. Get user's bookings: GET /api/bookings?userId=xxx (requires auth)
 * 2. Check availability: GET /api/bookings?slotId=xxx&startTime=xxx&endTime=xxx
 */
export async function GET(request: AuthenticatedRequest) {
  return authenticate(async (authRequest: AuthenticatedRequest) => {
    try {
      // First, sync booking/slot statuses
      await completeExpiredBookings();
      await markActiveBookingsAsOccupied();

      const searchParams = authRequest.nextUrl.searchParams;
      const slotId = searchParams.get('slotId');
      const startTime = searchParams.get('startTime');
      const endTime = searchParams.get('endTime');

      // Get user's bookings (default behavior without params)
      const user = (authRequest as AuthenticatedRequest).user;
      if (!user) {
        return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
      }

      // If no slot parameters provided, fetch user's bookings
      if (!slotId) {
        const bookings = await prisma.booking.findMany({
          where: {
            userId: user.userId,
          },
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
          orderBy: {
            createdAt: 'desc',
          },
        });

        return successResponse(
          {
            items: bookings.map((b) => ({
              id: b.id,
              slotId: b.slotId,
              slot: b.slot,
              startTime: b.startTime.toISOString(),
              endTime: b.endTime.toISOString(),
              status: b.status,
              totalPrice: b.totalPrice,
              createdAt: b.createdAt.toISOString(),
            })),
            total: bookings.length,
          },
          200
        );
      }

      // Mode 2: Check availability
      if (!startTime || !endTime) {
        return errorResponse(
          'Missing required parameters for availability check',
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
      console.error('Bookings error:', error);
      return errorResponse('Internal server error', 500);
    }
  })(request);
}
