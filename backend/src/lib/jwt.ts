/**
 * JWT Utility
 * 
 * JWT token generation and verification
 */

import jwt from 'jsonwebtoken';
import config from './config';
import { JWTPayload } from './types';
import { AUTH } from './constants';
import { UnauthorizedError } from './errors';

export class JWTUtil {
  static generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.JWT_SECRET, { expiresIn: AUTH.JWT_EXPIRATION });
  }

  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, config.JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch {
      return null;
    }
  }
}
