/**
 * Train DTOs
 * 
 * Data Transfer Objects for train operations
 */

import { z } from 'zod'

export const CreateTrainSchema = z.object({
  name: z.string().min(1, 'Train name is required'),
  number: z.string().min(1, 'Train number is required'),
  type: z.string().min(1, 'Train type is required'),
  trainRouteId: z.string().uuid('Invalid train route ID').optional(),
  compartmentIds: z.array(z.string().uuid('Invalid compartment ID')).optional(),
})

export const UpdateTrainSchema = CreateTrainSchema.partial()

export type CreateTrainDto = z.infer<typeof CreateTrainSchema>
export type UpdateTrainDto = z.infer<typeof UpdateTrainSchema>
