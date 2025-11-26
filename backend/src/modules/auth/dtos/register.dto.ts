/**
 * Registration DTOs
 * 
 * Data Transfer Objects for user/admin registration
 */

import { z } from 'zod';

export const RegisterAdminSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const RegisterUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  phone: z.string().optional(),
});

export type RegisterAdminDto = z.infer<typeof RegisterAdminSchema>;
export type RegisterUserDto = z.infer<typeof RegisterUserSchema>;
