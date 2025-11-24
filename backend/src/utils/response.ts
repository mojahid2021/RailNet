import { FastifyReply } from 'fastify'

export class ResponseHandler {
  static success<T>(reply: FastifyReply, data: T, message?: string, statusCode = 200) {
    return reply.code(statusCode).send({
      success: true,
      message,
      data,
    })
  }

  static error(reply: FastifyReply, message: string, statusCode = 400) {
    return reply.code(statusCode).send({
      success: false,
      error: message,
    })
  }

  static created<T>(reply: FastifyReply, data: T, message = 'Created successfully') {
    return this.success(reply, data, message, 201)
  }

  static conflict(reply: FastifyReply, message = 'Resource already exists') {
    return this.error(reply, message, 409)
  }
}