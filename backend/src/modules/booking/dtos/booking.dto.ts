/**
 * Booking DTOs
 * 
 * Data Transfer Objects for ticket booking
 */

import { z } from 'zod';

export const BookTicketSchema = z.object({
  scheduleId: z.string().uuid('Invalid schedule ID'),
  compartmentId: z.string().uuid('Invalid compartment ID'),
  seatNumber: z.string().min(1, 'Seat number is required'),
  fromStationId: z.string().uuid('Invalid from station ID'),
  toStationId: z.string().uuid('Invalid to station ID'),
});

export type BookTicketDto = z.infer<typeof BookTicketSchema>;
