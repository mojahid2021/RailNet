import Fastify from 'fastify';
import { config } from './config/index';
import { logger } from './utils/logger';
import { registerSecurity } from './middleware/security';
import { registerErrorHandler } from './middleware/errorHandler';
import { registerRoutes } from './routes';
import prisma from './utils/database';

// Create Fastify instance with custom logger
const server = Fastify({
  logger: false, // We'll use our custom logger
  disableRequestLogging: true, // We'll handle request logging manually
  ignoreTrailingSlash: true,
  bodyLimit: 10485760, // 10MB
});

// Register custom logger
server.decorate('logger', logger);

// Health check endpoint (before routes)
server.get('/health', async (request, reply) => {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: config.env,
      database: 'connected',
    };
  } catch (error) {
    logger.error('Health check failed', { error });
    return reply.status(503).send({
      status: 'error',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});

// Root endpoint
server.get('/', async () => ({
  message: 'RailNet API Server',
  version: '1.0.0',
  environment: config.env,
  timestamp: new Date().toISOString(),
}));

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully`);

  try {
    // Close database connections
    await prisma.$disconnect();
    logger.info('Database connections closed');

    // Close server
    await server.close();
    logger.info('Server closed');

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// Start server
const start = async () => {
  try {
    // Register security middleware
    await registerSecurity(server);

    // Register error handler
    registerErrorHandler(server);

    // Register all application routes
    await registerRoutes(server);

    await server.listen({
      port: config.port,
      host: config.host
    });

    logger.info('Server started successfully', {
      port: config.port,
      host: config.host,
      environment: config.env,
    });

  } catch (err) {
    logger.error('Failed to start server', { error: err });
    process.exit(1);
  }
};

// Start the server when this file is executed directly
if (require.main === module) {
  start();
}

export default server;
