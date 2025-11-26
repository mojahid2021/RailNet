import { FastifyRequest, FastifyReply } from 'fastify'
import { JWTUtils, JWTPayload } from '../utils/jwt'
import { ResponseHandler } from '../utils/response'

declare module 'fastify' {
  interface FastifyRequest {
    admin?: JWTPayload
    user?: JWTPayload
  }
}

export async function authenticateAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseHandler.error(reply, 'Authorization token required', 401)
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    const decoded = JWTUtils.verifyToken(token)

    if (decoded.type !== 'admin') {
      return ResponseHandler.error(reply, 'Invalid token type', 401)
    }

    request.admin = decoded
  } catch (error) {
    return ResponseHandler.error(reply, 'Invalid or expired token', 401)
  }
}

export async function authenticateUser(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseHandler.error(reply, 'Authorization token required', 401)
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    const decoded = JWTUtils.verifyToken(token)

    if (decoded.type !== 'user') {
      return ResponseHandler.error(reply, 'Invalid token type', 401)
    }

    request.user = decoded
  } catch (error) {
    return ResponseHandler.error(reply, 'Invalid or expired token', 401)
  }
}