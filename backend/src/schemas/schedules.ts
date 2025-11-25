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
  departureDate: z.string().datetime('Invalid departure date format'),
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
  departureDate: z.string().datetime('Invalid departure date format').optional(),
})

// Query parameters for schedule listing
export const scheduleQuerySchema = z.object({
  trainId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
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