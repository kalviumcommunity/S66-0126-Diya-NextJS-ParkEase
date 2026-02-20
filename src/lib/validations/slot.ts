import { z } from 'zod';
import { SlotStatus } from '@prisma/client';

/**
 * Validation schema for updating slot status (admin only)
 */
export const updateSlotSchema = z.object({
  slotId: z.string().uuid('Invalid slot ID'),
  status: z.enum([SlotStatus.AVAILABLE, SlotStatus.OCCUPIED, SlotStatus.RESERVED, SlotStatus.MAINTENANCE], {
    message: 'Invalid status. Must be one of: AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE',
  }),
});

export type UpdateSlotInput = z.infer<typeof updateSlotSchema>;
