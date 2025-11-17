/**
 * Global error handler middleware for RailNet Backend
 * Provides consistent error responses and logging
 */

import { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { appLogger } from '../logger';
import { ErrorResponse, ErrorParser, AppError } from '../../shared/errors';
import { config } from '../config';

/**
 * Register global error handler
 */
export function registerErrorHandler(server: FastifyInstance): void {
  server.setErrorHandler(async (error, request, reply) => {
    // Determine if we should include stack traces in response
    const includeStack = ErrorResponse.shouldIncludeStack(config.app.env);

    // Parse different error types
    let appError;

    if (error.name === 'ValidationError' || (error.validation && error.validation.length > 0)) {
      // Handle Fastify validation errors - convert to ZodError format
      const validationErrors = error.validation || [];
      const zodError: ZodError = {
        issues: validationErrors.map((err: any) => ({
          code: 'custom',
          path: err.instancePath ? err.instancePath.split('/').filter(Boolean) : [],
          message: err.message || 'Validation error',
        })),
      } as ZodError;
      appError = ErrorParser.fromZodError(zodError);
    } else if (error.code?.startsWith('P')) {
      // Handle Prisma database errors
      appError = ErrorParser.fromPrismaError(error);
    } else if (error.name?.includes('JWT') || error.name === 'TokenExpiredError') {
      // Handle JWT errors
      appError = ErrorParser.fromJWTError(error);
    } else if (error instanceof Error && 'statusCode' in error) {
      // Handle existing AppError instances
      appError = error;
    } else {
      // Handle unknown errors
      appError = {
        name: 'InternalServerError',
        message: error.message || 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
        category: 'SYSTEM',
        statusCode: 500,
        isOperational: false,
        details: includeStack ? { originalError: error.message } : undefined,
        timestamp: new Date(),
        stack: error.stack,
      };
    }

    // Log the error with context
    const logData = {
      error: {
        name: appError.name,
        message: appError.message,
        code: appError.code,
        category: (appError as { category?: string }).category || 'SYSTEM',
        statusCode: (appError as { statusCode?: number }).statusCode || 500,
        stack: includeStack ? appError.stack : undefined,
      },
      request: {
        method: request.method,
        url: request.url,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        userId: (request as { user?: { userId?: string } }).user?.userId,
        requestId: request.headers['x-request-id'],
      },
      response: {
        statusCode: appError.statusCode,
      },
    };

    // Log based on error severity
    if ((appError.statusCode || 500) >= 500) {
      appLogger.error('Server Error', logData);
    } else if ((appError.statusCode || 500) >= 400) {
      appLogger.warn('Client Error', logData);
    } else {
      appLogger.info('Error handled', logData);
    }

    // Send error response
    const errorResponse = ErrorResponse.create(appError as AppError, includeStack);

    return reply.status((appError as { statusCode?: number }).statusCode || 500).send(errorResponse);
  });

  appLogger.info('Global error handler registered');
}

/**
 * Handle 404 Not Found errors
 */
export function registerNotFoundHandler(server: FastifyInstance): void {
  server.setNotFoundHandler(async (request, reply) => {
    const errorResponse = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
      },
      timestamp: new Date().toISOString(),
    };

    appLogger.warn('Route not found', {
      method: request.method,
      url: request.url,
      ip: request.ip,
    });

    return reply.status(404).send(errorResponse);
  });

  appLogger.info('404 Not Found handler registered');
}

/**
 * Handle method not allowed errors
 */
export function registerMethodNotAllowedHandler(server: FastifyInstance): void {
  server.setErrorHandler(async (error, request, reply) => {
    if (error.statusCode === 405) {
      const errorResponse = {
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: `Method ${request.method} not allowed for ${request.url}`,
        },
        timestamp: new Date().toISOString(),
      };

      appLogger.warn('Method not allowed', {
        method: request.method,
        url: request.url,
        allowedMethods: (error as { allowedMethods?: string[] }).allowedMethods,
      });

      return reply.status(405).header('Allow', (error as { allowedMethods?: string[] }).allowedMethods?.join(', ') || '').send(errorResponse);
    }

    // If not a method not allowed error, continue to next handler
    throw error;
  });

  appLogger.info('Method Not Allowed handler registered');
}