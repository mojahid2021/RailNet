/**
 * Train Route DTOs
 * 
 * Data Transfer Objects for train route operations
 */

import { z } from 'zod'

const RouteStationSchema = z.object({
  currentStationId: z.string().uuid('Invalid current station ID'),
  beforeStationId: z.string().uuid().optional(),
  nextStationId: z.string().uuid().optional(),
  distance: z.number().positive('Distance must be positive'),
  distanceFromStart: z.number().min(0, 'Distance from start must be non-negative'),
})

export const CreateTrainRouteSchema = z.object({
  name: z.string().min(1, 'Train name is required'),
  totalDistance: z.number().positive('Total distance must be positive'),
  startStationId: z.string().uuid('Invalid start station ID'),
  endStationId: z.string().uuid('Invalid end station ID'),
  stations: z.array(RouteStationSchema).min(1, 'At least one station is required'),
})

export const UpdateTrainRouteSchema = z.object({
  name: z.string().min(1, 'Train name is required').optional(),
  totalDistance: z.number().positive('Total distance must be positive').optional(),
  startStationId: z.string().uuid('Invalid start station ID').optional(),
  endStationId: z.string().uuid('Invalid end station ID').optional(),
  stations: z.array(RouteStationSchema).optional(),
})

export type RouteStationDto = z.infer<typeof RouteStationSchema>
export type CreateTrainRouteDto = z.infer<typeof CreateTrainRouteSchema>
export type UpdateTrainRouteDto = z.infer<typeof UpdateTrainRouteSchema>
