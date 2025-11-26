/**
 * Schedule DTOs
 * 
 * Data Transfer Objects for schedule operations
 */

import { z } from 'zod'

// Station schedule input for creating a schedule
export const StationScheduleInputSchema = z.object({
  stationId: z.string().uuid('Invalid station ID'),
  estimatedArrival: z.string().datetime('Invalid arrival time format'),
  estimatedDeparture: z.string().datetime('Invalid departure time format'),
  platformNumber: z.string().optional(),
  remarks: z.string().optional(),
})

// Create schedule input schema
export const CreateScheduleSchema = z.object({
  trainId: z.string().uuid('Invalid train ID'),
  departureTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM (24-hour format)'),
  stationSchedules: z.array(StationScheduleInputSchema).min(1, 'At least one station schedule is required'),
})

// Update station schedule status
export const UpdateStationScheduleSchema = z.object({
  status: z.enum(['pending', 'arrived', 'departed', 'skipped', 'delayed']),
  actualArrival: z.string().datetime('Invalid actual arrival time').optional(),
  actualDeparture: z.string().datetime('Invalid actual departure time').optional(),
  platformNumber: z.string().optional(),
  remarks: z.string().optional(),
})

// Update schedule metadata
export const UpdateScheduleSchema = z.object({
  status: z.enum(['scheduled', 'running', 'completed', 'delayed', 'cancelled']).optional(),
  departureTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM (24-hour format)').optional(),
})

// Query parameters for schedule listing
export const ScheduleQuerySchema = z.object({
  trainId: z.string().uuid().optional(),
  departureTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  status: z.enum(['scheduled', 'running', 'completed', 'delayed', 'cancelled']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

// Type exports
export type StationScheduleInputDto = z.infer<typeof StationScheduleInputSchema>
export type CreateScheduleDto = z.infer<typeof CreateScheduleSchema>
export type UpdateStationScheduleDto = z.infer<typeof UpdateStationScheduleSchema>
export type UpdateScheduleDto = z.infer<typeof UpdateScheduleSchema>
export type ScheduleQueryDto = z.infer<typeof ScheduleQuerySchema>
