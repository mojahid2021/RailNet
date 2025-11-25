import { z } from 'zod'

// Station schedule input for creating a schedule
export const stationScheduleInputSchema = z.object({
  stationId: z.string().uuid('Invalid station ID'),
  estimatedArrival: z.string().datetime('Invalid arrival time format'),
  estimatedDeparture: z.string().datetime('Invalid departure time format'),
  platformNumber: z.string().optional(),
  remarks: z.string().optional(),
})

// Create schedule input schema
export const createScheduleSchema = z.object({
  trainId: z.string().uuid('Invalid train ID'),
  departureTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM (24-hour format)'),
  stationSchedules: z.array(stationScheduleInputSchema).min(1, 'At least one station schedule is required'),
})

// Update station schedule status
export const updateStationScheduleSchema = z.object({
  status: z.enum(['pending', 'arrived', 'departed', 'skipped', 'delayed']),
  actualArrival: z.string().datetime('Invalid actual arrival time').optional(),
  actualDeparture: z.string().datetime('Invalid actual departure time').optional(),
  platformNumber: z.string().optional(),
  remarks: z.string().optional(),
})

// Update schedule metadata
export const updateScheduleSchema = z.object({
  status: z.enum(['scheduled', 'running', 'completed', 'delayed', 'cancelled']).optional(),
  departureTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM (24-hour format)').optional(),
})

// Query parameters for schedule listing
export const scheduleQuerySchema = z.object({
  trainId: z.string().uuid().optional(),
  departureTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  status: z.enum(['scheduled', 'running', 'completed', 'delayed', 'cancelled']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

// Type exports
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>
export type StationScheduleInput = z.infer<typeof stationScheduleInputSchema>
export type UpdateStationScheduleInput = z.infer<typeof updateStationScheduleSchema>
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>
export type ScheduleQueryInput = z.infer<typeof scheduleQuerySchema>