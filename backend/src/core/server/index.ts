/**
 * Enhanced Fastify server setup for RailNet Backend
 * Provides structured server initialization with proper middleware and error handling
 */

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyJwt from '@fastify/jwt';

import { config } from '../config';
import { appLogger } from '../logger';
import { connectDatabase, disconnectDatabase } from '../database';
import { registerErrorHandler } from '../middleware/errorHandler';
import { registerRoutes } from './routes';
import { extractToken, verifyToken } from '../auth/jwt';

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
  await server.register(fastifyJwt, {
    secret: config.auth.jwt.secret,
    sign: {
      expiresIn: config.auth.jwt.expiresIn,
    },
  });

  // Add authentication decorators
  server.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      const token = extractToken(request.headers.authorization);
      if (!token) {
        return reply.status(401).send({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Authentication required',
          },
          timestamp: new Date().toISOString(),
        });
      }

      const decoded = verifyToken(token);
      (request as FastifyRequest & { user: typeof decoded }).user = decoded;

      appLogger.debug('JWT verification successful', { userId: decoded.userId });
    } catch (error) {
      appLogger.error('JWT verification failed', { 
        error: error instanceof Error ? error.message : String(error),
        authHeader: request.headers.authorization?.substring(0, 20) + '...'
      });
      return reply.status(401).send({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  server.decorate('auth', function (authFunctions: Function[]) {
    return async function (this: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
      for (const authFunction of authFunctions) {
        await authFunction.call(this, request, reply);
      }
    };
  });

  appLogger.info('JWT authentication middleware registered');
}

/**
 * Register application middleware
 */
export async function registerApplicationMiddleware(server: FastifyInstance): Promise<void> {
  // Request logging middleware
  server.addHook('onRequest', async (request) => {
    const startTime = Date.now();
    const requestId = request.headers['x-request-id'] as string ||
      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add request ID to request object
    (request as FastifyRequest & { requestId?: string }).requestId = requestId;

    // Create request logger with context
    const requestLogger = appLogger.child({
      requestId,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });

    // Store logger on request for use in handlers
    (request as FastifyRequest & { logger?: typeof appLogger }).logger = requestLogger;

    // Log request start
    requestLogger.info('Request started');

    // Store start time for response logging
    (request as FastifyRequest & { startTime?: number }).startTime = startTime;
  });

  // Response logging middleware
  server.addHook('onResponse', async (request, reply) => {
    const startTime = (request as FastifyRequest & { startTime?: number }).startTime || Date.now();
    const duration = Date.now() - startTime;
    const requestLogger = (request as FastifyRequest & { logger?: typeof appLogger }).logger || appLogger;

    // Log response details
    requestLogger.logRequest(
      request.method,
      request.url,
      reply.statusCode,
      duration
    );
  });
}

/**
 * Register health check endpoints
 */
export function registerHealthChecks(server: FastifyInstance): void {
  // Basic health check
  server.get('/health', async (request, reply) => {
    try {
      // Check database connectivity (optional)
      let dbStatus = 'disconnected';
      try {
        await connectDatabase();
        dbStatus = 'connected';
      } catch {
        // Database not available, but server can still respond
        dbStatus = 'disconnected';
      }

      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.app.env,
        version: process.env.npm_package_version || '1.0.0',
        checks: {
          database: dbStatus,
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

    // Register application routes
    await registerRoutes(server);

    // Setup graceful shutdown
    setupGracefulShutdown(server);

    appLogger.info('Attempting database connection...');

    // Connect to database (optional for development)
    try {
      await connectDatabase();
      appLogger.info('Database connection successful');
    } catch (error) {
      if (config.app.env === 'development') {
        appLogger.warn('Database connection failed, continuing in development mode', { error });
        appLogger.warn('Some features may not work without a database connection');
      } else {
        throw error; // Re-throw in production
      }
    }

    appLogger.info('Starting server listener...');

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
    appLogger.error('Server startup error details:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      port: finalConfig.port,
      host: finalConfig.host,
    });
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