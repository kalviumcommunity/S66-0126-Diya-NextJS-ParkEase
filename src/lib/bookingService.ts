import { prisma } from './db';
import { BookingStatus, SlotStatus } from '@prisma/client';

/**
 * Interface for booking request
 */
export interface BookingRequest {
  userId: string;
  slotId: string;
  startTime: Date;
  endTime: Date;
}

/**
 * Interface for booking response
 */
export interface BookingResponse {
  success: boolean;
  booking?: {
    id: string;
    userId: string;
    slotId: string;
    startTime: Date;
    endTime: Date;
    status: BookingStatus;
  };
  error?: string;
}

/**
 * Book a parking slot for a user with transaction to prevent double-booking
 *
 * Steps:
 * 1. Check if the slot exists and is AVAILABLE
 * 2. Check for overlapping bookings in the requested time period
 * 3. Create a CONFIRMED booking
 * 4. Update slot status to RESERVED
 *
 * @param request - Booking request with userId, slotId, startTime, endTime
 * @returns BookingResponse with booking details or error
 *
 * @example
 * ```typescript
 * const booking = await bookParkingSlot({
 *   userId: 'user-123',
 *   slotId: 'slot-456',
 *   startTime: new Date('2026-02-20T10:00:00Z'),
 *   endTime: new Date('2026-02-20T12:00:00Z'),
 * });
 *
 * if (booking.success) {
 *   console.log('Booking confirmed:', booking.booking?.id);
 * } else {
 *   console.error('Booking failed:', booking.error);
 * }
 * ```
 */
export async function bookParkingSlot(request: BookingRequest): Promise<BookingResponse> {
  const { userId, slotId, startTime, endTime } = request;

  // Validate input
  if (!userId || !slotId || !startTime || !endTime) {
    return {
      success: false,
      error: 'Missing required booking fields: userId, slotId, startTime, endTime',
    };
  }

  if (startTime >= endTime) {
    return {
      success: false,
      error: 'Start time must be before end time',
    };
  }

  if (startTime < new Date()) {
    return {
      success: false,
      error: 'Cannot book a slot in the past',
    };
  }

  try {
    // Run transaction to ensure atomicity and prevent race conditions
    const booking = await prisma.$transaction(async (tx) => {
      // Step 1: Check if slot exists and is AVAILABLE
      const slot = await tx.parkingSlot.findUnique({
        where: { id: slotId },
      });

      if (!slot) {
        throw new Error('Parking slot not found');
      }

      if (slot.status !== SlotStatus.AVAILABLE) {
        throw new Error(`Slot is not available. Current status: ${slot.status}`);
      }

      // Step 2: Check for overlapping bookings in the requested time period
      // A booking overlaps if:
      // - It's on the same slot AND
      // - Status is CONFIRMED or PENDING (not CANCELLED) AND
      // - Its time range intersects with the requested time range
      const conflictingBooking = await tx.booking.findFirst({
        where: {
          slotId,
          status: {
            in: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
          },
          // Check for time overlap using AND logic
          AND: [
            { startTime: { lt: endTime } }, // Existing booking starts before requested end time
            { endTime: { gt: startTime } }, // Existing booking ends after requested start time
          ],
        },
      });

      if (conflictingBooking) {
        throw new Error('Slot is already booked for the requested time period');
      }

      // Step 3: Create booking with CONFIRMED status
      const newBooking = await tx.booking.create({
        data: {
          userId,
          slotId,
          startTime,
          endTime,
          status: BookingStatus.CONFIRMED,
        },
      });

      // Step 4: Update slot status to RESERVED
      await tx.parkingSlot.update({
        where: { id: slotId },
        data: { status: SlotStatus.RESERVED },
      });

      return newBooking;
    });

    return {
      success: true,
      booking: {
        id: booking.id,
        userId: booking.userId,
        slotId: booking.slotId,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Check availability of a parking slot for a given time period
 *
 * @param slotId - ID of the parking slot
 * @param startTime - Booking start time
 * @param endTime - Booking end time
 * @returns true if slot is available, false otherwise
 *
 * @example
 * ```typescript
 * const isAvailable = await isSlotAvailable(
 *   'slot-123',
 *   new Date('2026-02-20T10:00:00Z'),
 *   new Date('2026-02-20T12:00:00Z')
 * );
 * ```
 */
export async function isSlotAvailable(
  slotId: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  try {
    const slot = await prisma.parkingSlot.findUnique({
      where: { id: slotId },
    });

    // Slot must exist and be AVAILABLE
    if (!slot || slot.status !== SlotStatus.AVAILABLE) {
      return false;
    }

    // Check for conflicting bookings
    const conflict = await prisma.booking.findFirst({
      where: {
        slotId,
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
        },
        AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
      },
    });

    return !conflict;
  } catch (error) {
    console.error('Error checking slot availability:', error);
    return false;
  }
}

/**
 * Get available slots for a given time period
 *
 * @param startTime - Booking start time
 * @param endTime - Booking end time
 * @returns Array of available parking slots
 *
 * @example
 * ```typescript
 * const available = await getAvailableSlots(
 *   new Date('2026-02-20T10:00:00Z'),
 *   new Date('2026-02-20T12:00:00Z')
 * );
 * ```
 */
export async function getAvailableSlots(startTime: Date, endTime: Date) {
  try {
    // Get all AVAILABLE slots
    const slots = await prisma.parkingSlot.findMany({
      where: { status: SlotStatus.AVAILABLE },
      orderBy: [{ row: 'asc' }, { column: 'asc' }],
    });

    // Filter out slots with conflicting bookings
    const availableSlots = await Promise.all(
      slots.map(async (slot) => {
        const isAvailable = await isSlotAvailable(slot.id, startTime, endTime);
        return isAvailable ? slot : null;
      })
    );

    return availableSlots.filter((slot) => slot !== null);
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return [];
  }
}

/**
 * Cancel a booking (soft delete - status set to CANCELLED)
 * and mark the slot as AVAILABLE again if no other active bookings exist
 *
 * @param bookingId - ID of the booking to cancel
 * @returns BookingResponse with cancellation status
 */
export async function cancelBooking(bookingId: string): Promise<BookingResponse> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get the booking
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status === BookingStatus.CANCELLED) {
        throw new Error('Booking is already cancelled');
      }

      // Update booking status to CANCELLED
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      });

      // Check if there are other active bookings for this slot
      const activeBookings = await tx.booking.findFirst({
        where: {
          slotId: booking.slotId,
          status: {
            in: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
          },
          id: { not: bookingId },
        },
      });

      // If no other active bookings, mark slot as AVAILABLE
      if (!activeBookings) {
        await tx.parkingSlot.update({
          where: { id: booking.slotId },
          data: { status: SlotStatus.AVAILABLE },
        });
      }

      return updatedBooking;
    });

    return {
      success: true,
      booking: {
        id: result.id,
        userId: result.userId,
        slotId: result.slotId,
        startTime: result.startTime,
        endTime: result.endTime,
        status: result.status,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return {
      success: false,
      error: errorMessage,
    };
  }
}
