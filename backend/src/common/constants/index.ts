/**
 * Application Constants
 * 
 * Centralized constants used throughout the application
 */

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const AUTH = {
  JWT_EXPIRATION: '7d',
  BCRYPT_SALT_ROUNDS: 10,
  TOKEN_PREFIX: 'Bearer',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const TRAIN_STATUS = {
  SCHEDULED: 'scheduled',
  RUNNING: 'running',
  COMPLETED: 'completed',
  DELAYED: 'delayed',
  CANCELLED: 'cancelled',
} as const;

export const BOOKING_STATUS = {
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const;

export const STATION_SCHEDULE_STATUS = {
  PENDING: 'pending',
  ARRIVED: 'arrived',
  DEPARTED: 'departed',
  SKIPPED: 'skipped',
  DELAYED: 'delayed',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Authorization token required',
  INVALID_TOKEN: 'Invalid or expired token',
  INVALID_TOKEN_TYPE: 'Invalid token type',
  FORBIDDEN: 'You do not have permission to access this resource',
  NOT_FOUND: 'Resource not found',
  ALREADY_EXISTS: 'Resource already exists',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
} as const;
