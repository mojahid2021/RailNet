import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, extractToken, JWTPayload } from '../utils/jwt';
import { UnauthorizedError } from '../errors';
import { logger } from '../utils/logger';

/**
 * Extend FastifyRequest interface to include user
 */
declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

/**
 * Authentication middleware
 */
export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const token = extractToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const decoded = verifyToken(token);
    request.user = decoded;

    logger.debug('User authenticated', { userId: decoded.userId, email: decoded.email });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.warn('Authentication failed', { error: errorMessage });
    throw new UnauthorizedError('Invalid token');
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...roles: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!roles.includes(request.user.role)) {
      throw new UnauthorizedError('Insufficient permissions');
    }

    logger.debug('User authorized', {
      userId: request.user.userId,
      role: request.user.role,
      requiredRoles: roles
    });
  };
};

/**
 * Optional authentication (doesn't throw if no token)
 */
export const optionalAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const token = extractToken(request.headers.authorization);

    if (token) {
      const decoded = verifyToken(token);
      request.user = decoded;
    }
  } catch (error) {
    // Silently fail for optional auth
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.debug('Optional authentication failed', { error: errorMessage });
  }
};