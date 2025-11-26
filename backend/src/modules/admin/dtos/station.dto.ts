/**
 * Station DTOs
 * 
 * Data Transfer Objects for station operations
 */

import { z } from 'zod'

export const CreateStationSchema = z.object({
  name: z.string().min(1, 'Station name is required'),
  city: z.string().min(1, 'City is required'),
  district: z.string().min(1, 'District is required'),
  division: z.string().min(1, 'Division is required'),
  latitude: z.number().min(-90).max(90, 'Invalid latitude'),
  longitude: z.number().min(-180).max(180, 'Invalid longitude'),
})

export const UpdateStationSchema = CreateStationSchema.partial()

export type CreateStationDto = z.infer<typeof CreateStationSchema>
export type UpdateStationDto = z.infer<typeof UpdateStationSchema>
