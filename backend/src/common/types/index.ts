/**
 * Common Types
 * 
 * Shared type definitions used across the application
 */

export type UUID = string;

export interface PaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

export type UserRole = 'admin' | 'user';

export interface JWTPayload {
  id: UUID;
  email: string;
  type: UserRole;
  iat?: number;
  exp?: number;
}

export interface IUser {
  id: UUID;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdmin {
  id: UUID;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
