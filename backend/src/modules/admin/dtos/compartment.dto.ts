/**
 * Compartment DTOs
 * 
 * Data Transfer Objects for compartment operations
 */

import { z } from 'zod'

export const CreateCompartmentSchema = z.object({
  name: z.string().min(1, 'Compartment name is required'),
  type: z.string().min(1, 'Compartment type is required'),
  price: z.number().positive('Price must be positive'),
  totalSeat: z.number().int().positive('Total seats must be a positive integer'),
})

export const UpdateCompartmentSchema = CreateCompartmentSchema.partial()

export type CreateCompartmentDto = z.infer<typeof CreateCompartmentSchema>
export type UpdateCompartmentDto = z.infer<typeof UpdateCompartmentSchema>
