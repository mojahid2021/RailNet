/**
 * Response Handler
 * 
 * Standardized response formatting utility
 */

import { FastifyReply } from 'fastify';
import { HTTP_STATUS } from './constants';
import { ApiResponse, PaginationMeta } from './types';

export class ResponseHandler {
  static success<T>(
    reply: FastifyReply,
    data: T,
    message?: string,
    statusCode: number = HTTP_STATUS.OK
  ): FastifyReply {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };

    return reply.code(statusCode).send(response);
  }

  static successWithPagination<T>(
    reply: FastifyReply,
    data: T,
    meta: PaginationMeta,
    message?: string,
    statusCode: number = HTTP_STATUS.OK
  ): FastifyReply {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      meta,
    };

    return reply.code(statusCode).send(response);
  }

  static error(
    reply: FastifyReply,
    message: string,
    statusCode: number = HTTP_STATUS.BAD_REQUEST
  ): FastifyReply {
    const response: ApiResponse = {
      success: false,
      error: message,
    };

    return reply.code(statusCode).send(response);
  }

  static created<T>(reply: FastifyReply, data: T, message = 'Created successfully'): FastifyReply {
    return this.success(reply, data, message, HTTP_STATUS.CREATED);
  }

  static noContent(reply: FastifyReply): FastifyReply {
    return reply.code(HTTP_STATUS.NO_CONTENT).send();
  }

  static conflict(reply: FastifyReply, message = 'Resource already exists'): FastifyReply {
    return this.error(reply, message, HTTP_STATUS.CONFLICT);
  }

  static notFound(reply: FastifyReply, message = 'Resource not found'): FastifyReply {
    return this.error(reply, message, HTTP_STATUS.NOT_FOUND);
  }

  static unauthorized(reply: FastifyReply, message = 'Unauthorized'): FastifyReply {
    return this.error(reply, message, HTTP_STATUS.UNAUTHORIZED);
  }

  static forbidden(reply: FastifyReply, message = 'Forbidden'): FastifyReply {
    return this.error(reply, message, HTTP_STATUS.FORBIDDEN);
  }
}
