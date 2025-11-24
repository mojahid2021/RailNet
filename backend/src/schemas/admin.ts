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

export type RegisterAdminInput = z.infer<typeof registerAdminSchema>
export type LoginAdminInput = z.infer<typeof loginAdminSchema>