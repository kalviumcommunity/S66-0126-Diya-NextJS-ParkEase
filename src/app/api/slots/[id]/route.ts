import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { successResponse, errorResponse } from '@/lib/apiResponse';
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

    // For now, return a mock response
    const slot = {
      id: slotId,
      row: 1,
      column: 1,
      status: 'AVAILABLE',
      pricePerHour: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return successResponse(slot, 200);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Get slot error:', errorMsg);
    return errorResponse('Internal server error', 500);
  }
}
