import { z } from 'zod';

/**
 * Validation schema for creating a booking
 */
export const createBookingSchema = z.object({
  slotId: z.string().uuid('Invalid slot ID'),
  startTime: z.string().datetime('Invalid start time. Use ISO 8601 format'),
  endTime: z.string().datetime('Invalid end time. Use ISO 8601 format'),
});

/**
 * Validation schema for checking slot availability
 */
export const checkAvailabilitySchema = z.object({
  slotId: z.string().uuid('Invalid slot ID'),
  startTime: z.string().datetime('Invalid start time. Use ISO 8601 format'),
  endTime: z.string().datetime('Invalid end time. Use ISO 8601 format'),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>;
