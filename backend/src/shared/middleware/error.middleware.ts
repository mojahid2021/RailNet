/**
 * Error Handling Middleware
 * 
 * Global error handler for Fastify
 */

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../errors';
import { logger } from '../../core/logger/logger.service';
import { HTTP_STATUS } from '../../common/constants';

export function errorHandler(
  error: FastifyError | AppError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Handle known application errors
  if (error instanceof AppError) {
    logger.warn(`Application Error: ${error.message}`, {
      statusCode: error.statusCode,
      path: request.url,
      method: request.method,
    });

    return reply.code(error.statusCode).send({
      success: false,
      error: error.message,
    });
  }

  // Handle validation errors from Fastify
  if (error.validation) {
    logger.warn('Validation Error', {
      validation: error.validation,
      path: request.url,
      method: request.method,
    });

    return reply.code(HTTP_STATUS.BAD_REQUEST).send({
      success: false,
      error: 'Validation error',
      details: error.validation,
    });
  }

  // Log unexpected errors
  logger.error('Unexpected Error:', {
    error: error.message,
    stack: error.stack,
    path: request.url,
    method: request.method,
  });

  // Don't expose internal error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : error.message;

  return reply.code(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
    success: false,
    error: message,
  });
}
