import { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * Register security middleware plugins
 */
export const registerSecurity = async (server: FastifyInstance) => {
  try {
    // Helmet - Security headers
    await server.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    });

    logger.info('Helmet security headers registered');

    // CORS - Cross-Origin Resource Sharing
    await server.register(cors, {
      origin: config.cors.origin === '*' ? true : config.cors.origin.split(','),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
      maxAge: 86400, // 24 hours
    });

    logger.info('CORS middleware registered');

    // Rate Limiting
    await server.register(rateLimit, {
      max: config.rateLimit.max,
      timeWindow: config.rateLimit.timeWindow,
      skipOnError: true,
      redis: config.redis.url ? new (require('redis')).createClient(config.redis.url) : undefined,
      keyGenerator: (req: any) => {
        // Use IP address for rate limiting, but allow authenticated users more requests
        return req.headers.authorization ? `user_${req.headers.authorization}` : req.ip;
      },
      errorResponseBuilder: () => ({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(config.rateLimit.timeWindow / 1000),
      }),
    });

    logger.info('Rate limiting middleware registered');

  } catch (error) {
    logger.error('Failed to register security middleware', { error });
    throw error;
  }
};