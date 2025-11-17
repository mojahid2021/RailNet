/**
 * JWT authentication utilities for RailNet Backend
 * Handles token generation, verification, and extraction
 */

import jwt from 'jsonwebtoken';
import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config';
import { JWTPayload } from '../../types/common';
import { appLogger } from '../logger';

/**
 * Generate JWT access token
 */
export function generateToken(payload: JWTPayload): string {
  try {
    const token = jwt.sign(payload, config.auth.jwt.secret, {
      expiresIn: config.auth.jwt.expiresIn,
      issuer: 'railnet-backend',
      audience: 'railnet-client',
    } as jwt.SignOptions);

    appLogger.debug('JWT token generated', {
      userId: payload.userId,
      expiresIn: config.auth.jwt.expiresIn,
    });

    return token;
  } catch (error) {
    appLogger.error('Failed to generate JWT token', { error });
    throw error;
  }
}

/**
 * Generate refresh token (for future use)
 */
export function generateRefreshToken(payload: Pick<JWTPayload, 'userId'>): string {
  try {
    const refreshToken = jwt.sign(
      { userId: payload.userId, type: 'refresh' },
      config.auth.jwt.secret,
      {
        expiresIn: '30d', // 30 days
        issuer: 'railnet-backend',
        audience: 'railnet-client',
      }
    );

    return refreshToken;
  } catch (error) {
    appLogger.error('Failed to generate refresh token', { error });
    throw error;
  }
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, config.auth.jwt.secret, {
      issuer: 'railnet-backend',
      audience: 'railnet-client',
    }) as JWTPayload;

    appLogger.debug('JWT token verified', {
      userId: decoded.userId,
      expiresAt: new Date(decoded.exp! * 1000).toISOString(),
    });

    return decoded;
  } catch (error) {
    appLogger.error('JWT token verification failed', { error });

    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else if (error instanceof jwt.NotBeforeError) {
      throw new Error('Token not active');
    }

    throw new Error('Token verification failed');
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Extract user ID from token without full verification (for logging)
 */
export function extractUserIdFromToken(token: string): string | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload | null;
    return decoded?.userId || null;
  } catch (error) {
    appLogger.debug('Failed to extract user ID from token', { error });
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as JWTPayload | null;
    if (!decoded?.exp) {
      return true;
    }

    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload | null;
    if (!decoded?.exp) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  } catch {
    return null;
  }
}

/**
 * Refresh access token using refresh token
 */
export function refreshAccessToken(refreshToken: string): string {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.auth.jwt.secret, {
      issuer: 'railnet-backend',
      audience: 'railnet-client',
    }) as JWTPayload & { type?: string };

    // Ensure it's a refresh token
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }

    // Generate new access token
    const newToken = generateToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    appLogger.info('Access token refreshed', { userId: decoded.userId });

    return newToken;
  } catch (error) {
    appLogger.error('Failed to refresh access token', { error });
    throw new Error('Invalid refresh token');
  }
}

/**
 * Create middleware for JWT authentication
 */
export function createJWTMiddleware() {
  return async function jwtAuth(request: FastifyRequest, reply: FastifyReply) {
    try {
      const token = extractToken(request.headers.authorization);

      if (!token) {
        return reply.status(401).send({
          error: 'Authentication required',
          message: 'No token provided',
        });
      }

      const decoded = verifyToken(token);

      // Attach user to request
      request.user = decoded;

      appLogger.debug('JWT authentication successful', {
        userId: decoded.userId,
        path: request.url,
      });

    } catch (error) {
      appLogger.warn('JWT authentication failed', {
        error: (error as Error).message,
        path: request.url,
      });

      return reply.status(401).send({
        error: 'Authentication failed',
        message: (error as Error).message,
      });
    }
  };
}

/**
 * Create middleware for role-based authorization
 */
export function createRoleMiddleware(allowedRoles: string[]) {
  return async function roleAuth(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({
        error: 'Authentication required',
        message: 'User not authenticated',
      });
    }

    if (!allowedRoles.includes((request.user as JWTPayload).role)) {
      appLogger.warn('Access denied due to insufficient permissions', {
        userId: (request.user as JWTPayload).userId,
        userRole: (request.user as JWTPayload).role,
        requiredRoles: allowedRoles,
        path: request.url,
      });

      return reply.status(403).send({
        error: 'Access denied',
        message: 'Insufficient permissions',
      });
    }

    appLogger.debug('Role authorization successful', {
      userId: (request.user as JWTPayload).userId,
      role: (request.user as JWTPayload).role,
      path: request.url,
    });
  };
}