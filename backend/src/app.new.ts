/**
 * Application Entry Point
 * 
 * Main application setup with professional structure
 */

import fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import 'dotenv/config';

import config from './core/config';
import { prisma, PrismaService } from './core/database/prisma.service';
import { logger } from './core/logger/logger.service';
import { errorHandler } from './shared/middleware/error.middleware';
import { authenticateUser } from './shared/middleware/auth.middleware';

// Import route modules
import { adminAuthRoutes, userAuthRoutes } from './modules/auth';
import { stationRoutes } from './modules/station';

// Import legacy routes (to be refactored)
import { trainRoutes as trainRouteRoutes } from './admin/trainRoutes';
import { compartmentRoutes } from './admin/compartments';
import { trainRoutes } from './admin/trains';
import { scheduleRoutes } from './schedules/schedules';

const app = fastify({
  logger: logger.getLogger(),
});

// Decorate app with Prisma client for backward compatibility
app.decorate('prisma', prisma);

// Security middleware
app.register(helmet, {
  contentSecurityPolicy: false,
});

app.register(cors, {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
});

app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// Error handler
app.setErrorHandler(errorHandler);

// Swagger documentation
app.register(swagger, {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'RailNet API',
      description: 'Professional Railway Management System API',
      version: '1.0.0',
    },
    servers: [
      {
        url: `http://${config.HOST === '0.0.0.0' ? 'localhost' : config.HOST}:${config.PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
});

app.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false,
  },
  staticCSP: false,
  transformStaticCSP: (header) => header,
});

// Health check endpoint
app.get('/', {
  preHandler: authenticateUser,
  schema: {
    description: 'Health check endpoint',
    tags: ['health'],
    security: [{ bearerAuth: [] }],
  },
}, async (request, reply) => {
  return { status: 'Server is running...', timestamp: new Date().toISOString() };
});

// Register routes
app.register(async (app) => {
  // New structured auth routes
  app.register(adminAuthRoutes, { prefix: '/admin' });
  app.register(userAuthRoutes, { prefix: '/auth' });

  // Legacy routes (to be refactored)
  app.register(stationRoutes, { prefix: '/stations' });
  app.register(trainRouteRoutes, { prefix: '/train-routes' });
  app.register(compartmentRoutes, { prefix: '/compartments' });
  app.register(trainRoutes, { prefix: '/trains' });
  app.register(scheduleRoutes, { prefix: '/schedules' });
}, { prefix: config.API_PREFIX });

// Graceful shutdown
app.addHook('onClose', async () => {
  await PrismaService.disconnect();
  logger.info('Application shutting down...');
});

// Start server
const start = async () => {
  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    logger.info(`Server listening on http://${config.HOST}:${config.PORT}`);
    logger.info(`API documentation available at http://${config.HOST}:${config.PORT}/docs`);
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

start();
