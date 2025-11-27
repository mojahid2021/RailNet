/**
 * Authentication Middleware
 * 
 * JWT-based authentication for admin and user routes
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { JWTUtil } from './jwt';
import { ResponseHandler } from './response';
import { ERROR_MESSAGES, USER_ROLES } from './constants';
import './types';

export async function authenticateAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseHandler.unauthorized(reply, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const token = authHeader.substring(7);
    const decoded = JWTUtil.verifyToken(token);

    if (decoded.type !== USER_ROLES.ADMIN) {
      return ResponseHandler.unauthorized(reply, ERROR_MESSAGES.INVALID_TOKEN_TYPE);
    }

    request.admin = decoded;
    request.currentUser = decoded;
  } catch (error) {
    return ResponseHandler.unauthorized(reply, ERROR_MESSAGES.INVALID_TOKEN);
  }
}

export async function authenticateUser(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseHandler.unauthorized(reply, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const token = authHeader.substring(7);
    const decoded = JWTUtil.verifyToken(token);

    if (decoded.type !== USER_ROLES.USER) {
      return ResponseHandler.unauthorized(reply, ERROR_MESSAGES.INVALID_TOKEN_TYPE);
    }

    request.user = decoded;
    request.currentUser = decoded;
  } catch (error) {
    return ResponseHandler.unauthorized(reply, ERROR_MESSAGES.INVALID_TOKEN);
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseHandler.unauthorized(reply, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const token = authHeader.substring(7);
    const decoded = JWTUtil.verifyToken(token);

    request.currentUser = decoded;
    
    if (decoded.type === USER_ROLES.ADMIN) {
      request.admin = decoded;
    } else if (decoded.type === USER_ROLES.USER) {
      request.user = decoded;
    }
  } catch (error) {
    return ResponseHandler.unauthorized(reply, ERROR_MESSAGES.INVALID_TOKEN);
  }
}
