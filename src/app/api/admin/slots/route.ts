import { successResponse, errorResponse } from '@/lib/apiResponse';
import { updateSlotSchema } from '@/lib/validations/slot';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { invalidateCachePattern } from '@/lib/redis';

/**
 * PUT /api/admin/slots
 * Update parking slot status (admin only)
 *
 * Request body:
 * {
 *   "slotId": "uuid",
 *   "status": "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE"
 * }
 *
 * Authorization:
 * - Requires JWT token with ADMIN role
 */
export const PUT = withAuth(['ADMIN'], async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();

    // Validate request body
    const validation = updateSlotSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.issues
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      return errorResponse(errors, 400, 'VALIDATION_ERROR');
    }

    const { slotId, status } = validation.data;

    // Check if slot exists
    const slot = await prisma.parkingSlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      return errorResponse('Parking slot not found', 404, 'SLOT_NOT_FOUND');
    }

    // Update slot status
    const updatedSlot = await prisma.parkingSlot.update({
      where: { id: slotId },
      data: { status },
    });

    // Invalidate slots cache after status change
    await invalidateCachePattern('slots:*');

    return successResponse(
      {
        slot: {
          id: updatedSlot.id,
          row: updatedSlot.row,
          column: updatedSlot.column,
          status: updatedSlot.status,
          updatedAt: updatedSlot.updatedAt,
        },
        previousStatus: slot.status,
        newStatus: status,
        updatedBy: request.user?.email,
        message: 'Slot status updated successfully',
      },
      200
    );
  } catch (error) {
    console.error('Update slot status error:', error);
    return errorResponse('Internal server error', 500);
  }
});
