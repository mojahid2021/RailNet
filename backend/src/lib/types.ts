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

/**
 * Common Interfaces
 * 
 * Shared interface definitions for the application
 */

export interface ILogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface IService<T> {
  findById(id: string): Promise<T>;
  findAll(): Promise<T[]>;
  create(data: any): Promise<T>;
  update(id: string, data: any): Promise<T>;
  delete(id: string): Promise<void>;
}

/**
 * Fastify Type Augmentation
 * 
 * Centralized type declarations for Fastify module augmentation
 */
declare module 'fastify' {
  interface FastifyRequest {
    admin?: JWTPayload;
    user?: JWTPayload;
    currentUser?: JWTPayload;
  }
}
