/**
 * Enhanced error handling system for RailNet Backend
 * Provides structured error classes, error codes, and consistent error responses
 */

import { ZodError } from 'zod';

// Error Codes and Categories
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resource Errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // Database Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  UNIQUE_CONSTRAINT_VIOLATION = 'UNIQUE_CONSTRAINT_VIOLATION',

  // External Service Errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // System Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Business Logic Errors
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
}

export enum ErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  RESOURCE = 'RESOURCE',
  DATABASE = 'DATABASE',
  EXTERNAL = 'EXTERNAL',
  SYSTEM = 'SYSTEM',
  BUSINESS = 'BUSINESS',
}

/**
 * Base application error class with enhanced features
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly category: ErrorCategory;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: ErrorCode,
    category: ErrorCategory,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.category = category;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    this.timestamp = new Date();

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to a plain object for logging/serialization
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

// Authentication & Authorization Errors
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', details?: Record<string, unknown>) {
    super(message, ErrorCode.UNAUTHORIZED, ErrorCategory.AUTHENTICATION, 401, details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', details?: Record<string, unknown>) {
    super(message, ErrorCode.FORBIDDEN, ErrorCategory.AUTHORIZATION, 403, details);
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = 'Token has expired', details?: Record<string, unknown>) {
    super(message, ErrorCode.TOKEN_EXPIRED, ErrorCategory.AUTHENTICATION, 401, details);
  }
}

export class InvalidTokenError extends AppError {
  constructor(message: string = 'Invalid token', details?: Record<string, unknown>) {
    super(message, ErrorCode.INVALID_TOKEN, ErrorCategory.AUTHENTICATION, 401, details);
  }
}

// Validation Errors
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: Record<string, unknown>) {
    super(message, ErrorCode.VALIDATION_ERROR, ErrorCategory.VALIDATION, 422, details);
  }
}

export class InvalidInputError extends AppError {
  constructor(message: string = 'Invalid input provided', details?: Record<string, unknown>) {
    super(message, ErrorCode.INVALID_INPUT, ErrorCategory.VALIDATION, 400, details);
  }
}

// Resource Errors
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', details?: Record<string, unknown>) {
    super(`${resource} not found`, ErrorCode.NOT_FOUND, ErrorCategory.RESOURCE, 404, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: Record<string, unknown>) {
    super(message, ErrorCode.CONFLICT, ErrorCategory.RESOURCE, 409, details);
  }
}

export class AlreadyExistsError extends AppError {
  constructor(resource: string = 'Resource', details?: Record<string, unknown>) {
    super(`${resource} already exists`, ErrorCode.ALREADY_EXISTS, ErrorCategory.RESOURCE, 409, details);
  }
}

// Database Errors
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: Record<string, unknown>) {
    super(message, ErrorCode.DATABASE_ERROR, ErrorCategory.DATABASE, 500, details);
  }
}

export class ConnectionError extends AppError {
  constructor(message: string = 'Database connection failed', details?: Record<string, unknown>) {
    super(message, ErrorCode.CONNECTION_ERROR, ErrorCategory.DATABASE, 503, details);
  }
}

// System Errors
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: Record<string, unknown>) {
    super(message, ErrorCode.INTERNAL_ERROR, ErrorCategory.SYSTEM, 500, details);
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string = 'Configuration error', details?: Record<string, unknown>) {
    super(message, ErrorCode.CONFIGURATION_ERROR, ErrorCategory.SYSTEM, 500, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', details?: Record<string, unknown>) {
    super(message, ErrorCode.RATE_LIMIT_EXCEEDED, ErrorCategory.SYSTEM, 429, details);
  }
}

// Business Logic Errors
export class BusinessRuleError extends AppError {
  constructor(message: string = 'Business rule violation', details?: Record<string, unknown>) {
    super(message, ErrorCode.BUSINESS_RULE_VIOLATION, ErrorCategory.BUSINESS, 400, details);
  }
}

export class OperationNotAllowedError extends AppError {
  constructor(message: string = 'Operation not allowed', details?: Record<string, unknown>) {
    super(message, ErrorCode.OPERATION_NOT_ALLOWED, ErrorCategory.BUSINESS, 403, details);
  }
}

/**
 * Error factory functions for common scenarios
 */
export const ErrorFactory = {
  // Authentication
  invalidCredentials: () => new AuthenticationError('Invalid email or password'),
  accountDisabled: () => new AuthenticationError('Account is disabled'),
  emailNotVerified: () => new AuthenticationError('Email not verified'),

  // Authorization
  insufficientPermissions: (requiredRole?: string) =>
    new AuthorizationError(`Insufficient permissions${requiredRole ? ` - ${requiredRole} required` : ''}`),

  // Validation
  requiredField: (field: string) => new ValidationError(`Field '${field}' is required`),
  invalidFormat: (field: string, expected: string) =>
    new ValidationError(`Field '${field}' must be ${expected}`),
  tooLong: (field: string, maxLength: number) =>
    new ValidationError(`Field '${field}' must be at most ${maxLength} characters`),
  tooShort: (field: string, minLength: number) =>
    new ValidationError(`Field '${field}' must be at least ${minLength} characters`),

  // Resources
  userNotFound: (userId?: string) =>
    new NotFoundError(`User${userId ? ` with ID ${userId}` : ''}`),
  resourceNotFound: (resource: string, id?: string) =>
    new NotFoundError(`${resource}${id ? ` with ID ${id}` : ''}`),

  // Database
  uniqueConstraintViolation: (field: string) =>
    new ConflictError(`A record with this ${field} already exists`),
  foreignKeyViolation: (field: string) =>
    new ValidationError(`Referenced ${field} does not exist`),
};

/**
 * Error parsing utilities
 */
export class ErrorParser {
  /**
   * Parse Zod validation errors into our ValidationError format
   */
  static fromZodError(error: ZodError): ValidationError {
    const details: Record<string, string[]> = {};

    error.issues.forEach((err) => {
      const path = err.path.join('.');
      if (!details[path]) {
        details[path] = [];
      }
      details[path].push(err.message);
    });

    return new ValidationError('Validation failed', { fields: details });
  }

  /**
   * Parse Prisma errors into appropriate AppError instances
   */
  static fromPrismaError(error: { code?: string; message?: string; meta?: unknown }): AppError {
    const message = error.message || 'Database error';

    // Handle specific Prisma error codes
    switch (error.code) {
      case 'P2002':
        return new ConflictError('A record with this information already exists');
      case 'P2025':
        return new NotFoundError('Record not found');
      case 'P1001':
        return new ConnectionError('Database connection failed');
      default:
        return new DatabaseError(message, { code: error.code, meta: error.meta });
    }
  }

  /**
   * Parse JWT errors
   */
  static fromJWTError(error: { name?: string; message?: string }): AppError {
    switch (error.name) {
      case 'TokenExpiredError':
        return new TokenExpiredError();
      case 'JsonWebTokenError':
        return new InvalidTokenError();
      case 'NotBeforeError':
        return new InvalidTokenError('Token not active');
      default:
        return new AuthenticationError('Token validation failed');
    }
  }
}

/**
 * Error response utilities
 */
export class ErrorResponse {
  /**
   * Create a standardized error response
   */
  static create(error: AppError | Error, includeStack: boolean = false) {
    const appError = error instanceof AppError ? error : new InternalServerError(error.message);

    const response: Record<string, unknown> = {
      success: false,
      error: {
        code: appError.code,
        message: appError.message,
        category: appError.category,
      },
      timestamp: appError.timestamp.toISOString(),
    };

    // Include additional details for development
    if (includeStack && appError.details) {
      (response.error as Record<string, unknown>).details = appError.details;
    }

    // Include stack trace in development
    if (includeStack && appError.stack) {
      (response.error as Record<string, unknown>).stack = appError.stack;
    }

    return response;
  }

  /**
   * Check if error should include stack trace in response
   */
  static shouldIncludeStack(env: string): boolean {
    return env === 'development' || env === 'test';
  }
}