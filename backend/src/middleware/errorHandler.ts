import { FastifyInstance } from 'fastify';
import { AppError } from '../errors';
import { logger } from '../utils/logger';
import { config } from '../config';

/**
 * Global error handler for Fastify
 */
export const errorHandler = (error: any, request: any, reply: any) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_ERROR';
  let details: any = undefined;

  // Handle known application errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || 'APP_ERROR';
    details = (error as any).details;
  }
  // Handle Fastify validation errors
  else if (error.validation) {
    statusCode = 400;
    message = 'Validation Error';
    code = 'VALIDATION_ERROR';
    details = error.validation;
  }
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  }
  // Handle database errors
  else if (error.code === 'P2002') {
    statusCode = 409;
    message = 'Resource already exists';
    code = 'DUPLICATE_ENTRY';
  }
  else if (error.code?.startsWith('P')) {
    statusCode = 400;
    message = 'Database operation failed';
    code = 'DATABASE_ERROR';
  }
  // Handle other known errors
  else if (error.statusCode) {
    statusCode = error.statusCode;
    message = error.message || message;
  }

  // Log the error
  const logData = {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    },
    request: {
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    },
    response: {
      statusCode,
      code,
    },
  };

  if (statusCode >= 500) {
    logger.error('Server Error', logData);
  } else if (statusCode >= 400) {
    logger.warn('Client Error', logData);
  } else {
    logger.info('Error handled', logData);
  }

  // Send error response
  const response: any = {
    error: {
      message,
      code,
      timestamp: new Date().toISOString(),
    },
  };

  // Include details in development mode
  if (config.isDevelopment && details) {
    response.error.details = details;
  }

  reply.status(statusCode).send(response);
};

/**
 * Register error handling
 */
export const registerErrorHandler = (server: FastifyInstance) => {
  server.setErrorHandler(errorHandler);
};