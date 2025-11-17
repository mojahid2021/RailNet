/**
 * Common types and interfaces used throughout the RailNet application
 */

// HTTP Status Codes
export type HttpStatusCode =
  | 200 | 201 | 204 | 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 502 | 503;

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
  meta?: {
    pagination?: PaginationMeta;
    version?: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Request/Response Types
export interface PaginatedQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchQuery extends PaginatedQuery {
  search?: string;
  filters?: Record<string, unknown>;
}

// User Types (Base)
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'ADMIN' | 'STAFF' | 'PASSENGER';

// Authentication Types
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
  refreshToken?: string;
}

// Common Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Database Types
export interface DatabaseConnection {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  $queryRaw<T = unknown>(query: string, ...params: unknown[]): Promise<T>;
}

// Service Layer Types
export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: Record<string, string[]>;
}

// Middleware Types
export type MiddlewareFunction = (request: unknown, reply: unknown, done: () => void) => void;
export type AsyncMiddlewareFunction = (request: unknown, reply: unknown) => Promise<void>;

// Error Types
export interface ErrorContext {
  userId?: string;
  requestId?: string;
  operation?: string;
  metadata?: Record<string, unknown>;
}

// Event Types (for future event-driven architecture)
export interface BaseEvent {
  id: string;
  type: string;
  timestamp: Date;
  payload: Record<string, unknown>;
}

export interface UserEvent extends BaseEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted' | 'user.logged_in';
  payload: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

// Configuration Types
export interface DatabaseConfig {
  url: string;
  maxConnections?: number;
  ssl?: boolean;
}

export interface RedisConfig {
  url: string;
  ttl?: number;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// File Upload Types
export interface FileUpload {
  filename: string;
  mimetype: string;
  encoding: string;
  buffer: Buffer;
  size: number;
}

export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

// Cache Types
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key?: string;
}

export interface CacheEntry<T = unknown> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

// Job Queue Types (for future background processing)
export interface Job<T = unknown> {
  id: string;
  type: string;
  data: T;
  priority?: number;
  delay?: number;
  attempts?: number;
  maxAttempts?: number;
}

export interface JobResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  attempts: number;
}

// Health Check Types
export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  responseTime?: number;
  timestamp: Date;
}

export interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  checks: HealthCheck[];
  timestamp: Date;
}