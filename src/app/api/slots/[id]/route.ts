import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { completeExpiredBookings, markActiveBookingsAsOccupied } from '@/lib/bookingService';

/**
 * GET /api/slots/[id]
 * Get details of a specific parking slot
 *
 * Path parameters:
 * - id: Slot ID (UUID)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await completeExpiredBookings();
    await markActiveBookingsAsOccupied();

    const { id: slotId } = await params;

    if (!slotId) {
      return errorResponse('Slot ID is required', 400, 'MISSING_PARAM');
    }

    // Query the database for the slot
    const slot = await prisma.parkingSlot.findUnique({
      where: { id: slotId },
      select: {
        id: true,
        row: true,
        column: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!slot) {
      return errorResponse('Slot not found', 404, 'SLOT_NOT_FOUND');
    }

    return successResponse(
      {
        ...slot,
        pricePerHour: 5,
      },
      200
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Get slot error:', errorMsg);
    return errorResponse('Internal server error', 500);
  }
}
