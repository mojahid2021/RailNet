/**
 * Fastify Type Augmentation
 * 
 * Centralized type declarations for Fastify module augmentation
 */

import { JWTPayload } from './index';

declare module 'fastify' {
  interface FastifyRequest {
    admin?: JWTPayload;
    user?: JWTPayload;
    currentUser?: JWTPayload;
  }
}
