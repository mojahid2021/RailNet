/**
 * Error Handler Utility
 * 
 * Centralized error handling for controllers
 */

import { FastifyReply } from 'fastify';
import { NotFoundError, ConflictError, ValidationError, UnauthorizedError, ForbiddenError } from '../errors';
import { ResponseHandler } from './response.handler';

export class ErrorHandlerUtil {
  /**
   * Handle errors in a consistent way across all controllers
   * @param reply - Fastify reply object
   * @param error - The error to handle
   * @returns FastifyReply with appropriate error response
   */
  static handle(reply: FastifyReply, error: unknown): FastifyReply {
    if (error instanceof NotFoundError) {
      return ResponseHandler.notFound(reply, error.message);
    }
    
    if (error instanceof ConflictError) {
      return ResponseHandler.conflict(reply, error.message);
    }
    
    if (error instanceof ValidationError) {
      return ResponseHandler.error(reply, error.message, 400);
    }
    
    if (error instanceof UnauthorizedError) {
      return ResponseHandler.unauthorized(reply, error.message);
    }
    
    if (error instanceof ForbiddenError) {
      return ResponseHandler.forbidden(reply, error.message);
    }
    
    // For unknown errors
    const message = error instanceof Error ? error.message : 'Internal server error';
    return ResponseHandler.error(reply, message, 500);
  }

  /**
   * Async wrapper for route handlers with automatic error handling
   * @param handler - The async route handler function
   * @returns Wrapped handler with error handling
   */
  static async wrap(
    handler: (request: any, reply: any) => Promise<any>
  ): Promise<(request: any, reply: any) => Promise<any>> {
    return async (request: any, reply: any) => {
      try {
        return await handler(request, reply);
      } catch (error) {
        return ErrorHandlerUtil.handle(reply, error);
      }
    };
  }
}
