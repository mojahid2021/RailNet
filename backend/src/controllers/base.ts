import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Base controller class with common functionality
 */
export abstract class BaseController {
  /**
   * Send success response
   */
  protected success<T>(
    reply: FastifyReply,
    data: T,
    message?: string,
    statusCode: number = 200
  ) {
    return reply.status(statusCode).send({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send error response
   */
  protected error(
    reply: FastifyReply,
    message: string,
    statusCode: number = 500,
    code?: string
  ) {
    return reply.status(statusCode).send({
      success: false,
      error: {
        message,
        code,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send paginated response
   */
  protected paginated<T>(
    reply: FastifyReply,
    data: T[],
    total: number,
    page: number,
    limit: number,
    message?: string
  ) {
    const totalPages = Math.ceil(total / limit);

    return reply.status(200).send({
      success: true,
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      timestamp: new Date().toISOString(),
    });
  }
}