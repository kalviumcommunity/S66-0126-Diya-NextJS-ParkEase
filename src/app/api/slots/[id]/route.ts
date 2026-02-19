import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { AuthUser } from '@/lib/auth';

/**
 * GET /api/slots/[id]
 * Get details of a specific parking slot
 *
 * Path parameters:
 * - id: Slot ID (UUID)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authenticate the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401);
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return errorResponse('Internal server error', 500);
    }

    try {
      jwt.verify(token, jwtSecret) as AuthUser;
    } catch (tokenErr) {
      console.error('Token verification error:', tokenErr);
      return errorResponse('Unauthorized', 401);
    }

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
