/**
 * Enhanced Fastify server setup for RailNet Backend
 * Provides structured server initialization with proper middleware and error handling
 */

import Fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyJwt from '@fastify/jwt';

import { config } from '../config';
import { appLogger, createRequestLogger } from '../logger';
import { connectDatabase, disconnectDatabase } from '../database';
import { registerErrorHandler } from '../middleware/errorHandler';
import { registerRoutes } from './routes';

import { HTTP_STATUS, TIME_CONSTANTS } from '../../shared/constants';

/**
 * Server configuration interface
 */
interface ServerConfig {
  port: number;
  host: string;
  logger: boolean;
}

/**
 * Create and configure Fastify server instance
 */
export async function createServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: false, // Using custom logger
    disableRequestLogging: true, // Custom request logging
    ignoreTrailingSlash: true,
    bodyLimit: 10 * 1024 * 1024, // 10MB
    trustProxy: true, // Trust proxy headers
  });

  // Attach custom logger to server instance
  server.decorate('appLogger', appLogger);

  return server;
}

/**
 * Register core security middleware
 */
export async function registerSecurityMiddleware(server: FastifyInstance): Promise<void> {
  // Helmet for security headers
  if (config.security.helmet.enabled) {
    await server.register(fastifyHelmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: TIME_CONSTANTS.YEAR / 1000, // 1 year in seconds
        includeSubDomains: true,
        preload: true,
      },
    });
    appLogger.info('Helmet security headers registered');
  }

  // CORS configuration
  if (config.security.cors.enabled) {
    await server.register(fastifyCors, {
      origin: config.security.cors.origin === '*' ? true : config.security.cors.origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      maxAge: TIME_CONSTANTS.DAY / 1000, // 24 hours in seconds
    });
    appLogger.info('CORS middleware registered');
  }

  // Rate limiting
  if (config.security.rateLimit.enabled) {
    await server.register(fastifyRateLimit, {
      max: config.security.rateLimit.max,
      timeWindow: config.security.rateLimit.timeWindow,
      skipOnError: false,
      keyGenerator: (req) => {
        // Use IP address for rate limiting
        return req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
               req.headers['x-real-ip']?.toString() ||
               req.ip ||
               'unknown';
      },
      errorResponseBuilder: () => ({
        statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded, please try again later',
      }),
    });
    appLogger.info('Rate limiting middleware registered');
  }

  // JWT authentication
  // JWT authentication - using any due to complex fastify-jwt type definitions
  await server.register(fastifyJwt as any, {
    secret: config.auth.jwt.secret,
    sign: {
      expiresIn: config.auth.jwt.expiresIn,
    },
    verify: {
      extractToken: (request: FastifyRequest) => {
        const authHeader = request.headers.authorization;
        if (!authHeader) return undefined;

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
          return undefined;
        }

        return parts[1];
      },
    },
  });
  appLogger.info('JWT authentication middleware registered');
}

/**
 * Register application middleware
 */
export async function registerApplicationMiddleware(server: FastifyInstance): Promise<void> {
  // Request logging middleware
  server.addHook('onRequest', createRequestLogger() as any);

  // Add request context
  server.addHook('onRequest', async (request: FastifyRequest & { timestamp?: Date }) => {
    // Generate request ID if not present
    if (!request.headers['x-request-id']) {
      request.headers['x-request-id'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Add timestamp
    request.timestamp = new Date();
  });

  // Add response context
  server.addHook('onResponse', async (request: FastifyRequest & { timestamp?: Date }, reply) => {
    const duration = Date.now() - (request.timestamp?.getTime() || Date.now());

    // Log response details
    appLogger.debug('Request completed', {
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration,
      requestId: request.headers['x-request-id'] as string,
    });
  });
}

/**
 * Register health check endpoints
 */
export function registerHealthChecks(server: FastifyInstance): void {
  // Basic health check
  server.get('/health', async (request, reply) => {
    try {
      // Check database connectivity
      await connectDatabase();

      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.app.env,
        version: process.env.npm_package_version || '1.0.0',
        checks: {
          database: 'connected',
        },
      };

      return reply.status(HTTP_STATUS.OK).send(health);
    } catch (error) {
      appLogger.error('Health check failed', { error });

      const unhealthy = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.app.env,
        checks: {
          database: 'disconnected',
        },
        error: config.app.isDevelopment ? (error as Error).message : 'Service unavailable',
      };

      return reply.status(HTTP_STATUS.SERVICE_UNAVAILABLE).send(unhealthy);
    }
  });

  // Detailed health check
  server.get('/health/detailed', async (request, reply) => {
    const startTime = Date.now();

    try {
      // Database health check with timing
      const dbStartTime = Date.now();
      await connectDatabase();
      const dbLatency = Date.now() - dbStartTime;

      // System information
      const memUsage = process.memoryUsage();
      const systemHealth = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.app.env,
        version: process.env.npm_package_version || '1.0.0',
        checks: {
          database: {
            status: 'healthy',
            latency: `${dbLatency}ms`,
            timestamp: new Date().toISOString(),
          },
          system: {
            status: 'healthy',
            memory: {
              rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
              heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
              heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
              external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
            },
            cpu: process.cpuUsage(),
            platform: process.platform,
            nodeVersion: process.version,
          },
        },
        responseTime: `${Date.now() - startTime}ms`,
      };

      return reply.status(HTTP_STATUS.OK).send(systemHealth);
    } catch (error) {
      appLogger.error('Detailed health check failed', { error });

      const failedHealth = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.app.env,
        checks: {
          database: {
            status: 'unhealthy',
            error: (error as Error).message,
            timestamp: new Date().toISOString(),
          },
        },
        responseTime: `${Date.now() - startTime}ms`,
      };

      return reply.status(HTTP_STATUS.SERVICE_UNAVAILABLE).send(failedHealth);
    }
  });
}

/**
 * Setup graceful shutdown handlers
 */
export function setupGracefulShutdown(server: FastifyInstance): void {
  const shutdown = async (signal: string) => {
    appLogger.info(`Received ${signal}, initiating graceful shutdown`);

    try {
      // Stop accepting new connections
      await server.close();

      // Close database connections
      await disconnectDatabase();

      appLogger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      appLogger.error('Error during graceful shutdown', { error });
      process.exit(1);
    }
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    appLogger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    appLogger.error('Unhandled Rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      promise,
    });
    process.exit(1);
  });
}

/**
 * Start the server
 */
export async function startServer(serverConfig?: Partial<ServerConfig>): Promise<void> {
  const finalConfig = {
    port: serverConfig?.port || config.app.port,
    host: serverConfig?.host || config.app.host,
    logger: serverConfig?.logger || false,
  };

  try {
    // Create server instance
    const server = await createServer();

    // Register security middleware
    await registerSecurityMiddleware(server);

    // Register application middleware
    await registerApplicationMiddleware(server);

    // Register error handler
    registerErrorHandler(server);

    // Register health checks
    registerHealthChecks(server);

    // Register application routes
    await registerRoutes(server);

    // Setup graceful shutdown
    setupGracefulShutdown(server);

    // Connect to database
    await connectDatabase();

    // Start listening
    await server.listen(finalConfig);

    appLogger.info('🚀 Server started successfully', {
      port: finalConfig.port,
      host: finalConfig.host,
      environment: config.app.env,
      version: process.env.npm_package_version || '1.0.0',
    });

  } catch (error) {
    appLogger.error('❌ Failed to start server', { error });
    process.exit(1);
  }
}

/**
 * Stop the server (for testing)
 */
export async function stopServer(server: FastifyInstance): Promise<void> {
  try {
    await server.close();
    await disconnectDatabase();
    appLogger.info('Server stopped successfully');
  } catch (error) {
    appLogger.error('Error stopping server', { error });
    throw error;
  }
}