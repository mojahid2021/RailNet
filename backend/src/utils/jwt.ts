import jwt from 'jsonwebtoken'
import config from '../config'

export interface JWTPayload {
  id: string
  email: string
  type: 'admin'
}

export class JWTUtils {
  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '7d' })
  }

  static verifyToken(token: string): JWTPayload {
    return jwt.verify(token, config.JWT_SECRET) as JWTPayload
  }
}