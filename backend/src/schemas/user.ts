import { z } from 'zod'

export const registerUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  phone: z.string().optional(),
})

export const loginUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export const bookTicketSchema = z.object({
  scheduleId: z.string().uuid('Invalid schedule ID'),
  compartmentId: z.string().uuid('Invalid compartment ID'),
  seatNumber: z.string().min(1, 'Seat number is required'),
  fromStationId: z.string().uuid('Invalid from station ID'),
  toStationId: z.string().uuid('Invalid to station ID'),
})

export type RegisterUserInput = z.infer<typeof registerUserSchema>
export type LoginUserInput = z.infer<typeof loginUserSchema>
export type BookTicketInput = z.infer<typeof bookTicketSchema>