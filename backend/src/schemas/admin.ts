import { z } from 'zod'

export const registerAdminSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
})

export const loginAdminSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export const createStationSchema = z.object({
  name: z.string().min(1, 'Station name is required'),
  city: z.string().min(1, 'City is required'),
  district: z.string().min(1, 'District is required'),
  division: z.string().min(1, 'Division is required'),
  latitude: z.number().min(-90).max(90, 'Invalid latitude'),
  longitude: z.number().min(-180).max(180, 'Invalid longitude'),
})

export const updateStationSchema = createStationSchema.partial()

export const createTrainRouteSchema = z.object({
  name: z.string().min(1, 'Train name is required'),
  totalDistance: z.number().positive('Total distance must be positive'),
  startStationId: z.string().uuid('Invalid start station ID'),
  endStationId: z.string().uuid('Invalid end station ID'),
  stations: z.array(z.object({
    currentStationId: z.string().uuid('Invalid current station ID'),
    beforeStationId: z.string().uuid().optional(),
    nextStationId: z.string().uuid().optional(),
    distance: z.number().positive('Distance must be positive'),
    distanceFromStart: z.number().min(0, 'Distance from start must be non-negative'),
  })).min(1, 'At least one station is required'),
})

export const updateTrainRouteSchema = z.object({
  name: z.string().min(1, 'Train name is required').optional(),
  totalDistance: z.number().positive('Total distance must be positive').optional(),
  startStationId: z.string().uuid('Invalid start station ID').optional(),
  endStationId: z.string().uuid('Invalid end station ID').optional(),
  stations: z.array(z.object({
    currentStationId: z.string().uuid('Invalid current station ID'),
    beforeStationId: z.string().uuid().optional(),
    nextStationId: z.string().uuid().optional(),
    distance: z.number().positive('Distance must be positive'),
    distanceFromStart: z.number().min(0, 'Distance from start must be non-negative'),
  })).optional(),
})

export const createCompartmentSchema = z.object({
  name: z.string().min(1, 'Compartment name is required'),
  type: z.string().min(1, 'Compartment type is required'),
  price: z.number().positive('Price must be positive'),
  totalSeat: z.number().int().positive('Total seats must be a positive integer'),
})

export const updateCompartmentSchema = createCompartmentSchema.partial()

export const createTrainSchema = z.object({
  name: z.string().min(1, 'Train name is required'),
  number: z.string().min(1, 'Train number is required'),
  type: z.string().min(1, 'Train type is required'),
  trainRouteId: z.string().uuid('Invalid train route ID').optional(),
  compartmentIds: z.array(z.string().uuid('Invalid compartment ID')).optional(),
})

export const updateTrainSchema = createTrainSchema.partial()

export type RegisterAdminInput = z.infer<typeof registerAdminSchema>
export type LoginAdminInput = z.infer<typeof loginAdminSchema>
export type CreateStationInput = z.infer<typeof createStationSchema>
export type UpdateStationInput = z.infer<typeof updateStationSchema>
export type CreateTrainRouteInput = z.infer<typeof createTrainRouteSchema>
export type UpdateTrainRouteInput = z.infer<typeof updateTrainRouteSchema>
export type CreateCompartmentInput = z.infer<typeof createCompartmentSchema>
export type UpdateCompartmentInput = z.infer<typeof updateCompartmentSchema>
export type CreateTrainInput = z.infer<typeof createTrainSchema>
export type UpdateTrainInput = z.infer<typeof updateTrainSchema>