import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import authRoutes from './routes/auth';
import stationRoutes from './routes/stations';
import trainRouteRoutes from './routes/trainRoutes';
import compartmentRoutes from './routes/compartments';
import trainRoutes from './routes/trains';
import trainScheduleRoutes from './routes/trainSchedules';
import ticketRoutes from './routes/tickets';
import paymentRoutes from './routes/payments';
import { cleanupJobs } from './services/cleanupJobs';
import { swaggerSchemas } from './schemas/index.js';

const start = async () => {
  const app = Fastify({
    logger: {
      level: 'info',
    },
  });

  // Global error handler
  app.setErrorHandler((error: any, request: any, reply: any) => {
    app.log.error(error);
    reply.code(500).send({ error: 'Internal Server Error' });
  });

  try {
    // Register plugins
    await app.register(fastifyCors, {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    });

    await app.register(fastifyRateLimit, {
      max: 100,
      timeWindow: '1 minute',
    });

    await app.register(fastifySwagger, {
      openapi: {
        openapi: '3.0.0',
        info: {
          title: 'RailNet Backend API',
          description: 'A comprehensive railway management system API built with Fastify and TypeScript.\n\n' +
            '## Features\n' +
            '- **Authentication**: JWT-based user authentication with role-based access control\n' +
            '- **Station Management**: CRUD operations for railway stations\n' +
            '- **Train Route Management**: Create and manage train routes with station sequences\n' +
            '- **Compartment Management**: Manage different train compartments with pricing\n' +
            '- **Train Assembly**: Build trains by combining routes and compartments\n' +
            '- **Schedule Management**: Create train schedules with station-specific timing\n' +
            '- **Train Search**: Search for available trains between stations\n' +
            '- **Ticket Booking**: Complete ticket booking system with seat management and distance-based pricing\n' +
            '- **Payment Processing**: SSLCommerz integration with automatic booking expiration and cleanup\n\n' +
            '## Authentication\n' +
            'All endpoints except authentication and payment callbacks require a valid JWT token in the Authorization header:\n' +
            '`Authorization: Bearer <your-jwt-token>`\n\n' +
            '## Payment System\n' +
            'The API includes a complete payment processing system using SSLCommerz:\n' +
            '- Secure payment initiation with customer details\n' +
            '- Automatic booking expiration after 10 minutes\n' +
            '- Real-time payment status updates via callbacks\n' +
            '- Scheduled cleanup of expired bookings\n' +
            '- Admin tools for monitoring and manual cleanup\n\n' +
            '## Data Models\n' +
            'The API uses PostgreSQL with Prisma ORM and includes comprehensive relationships between:\n' +
            '- Users, Stations, Train Routes, Compartments, Trains, Schedules, and Tickets',
          version: '1.0.0',
          contact: {
            name: 'RailNet Support',
            email: 'support@railnet.com',
          },
          license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT',
          },
        },
        servers: [
          {
            url: 'http://localhost:3000',
            description: 'Development server',
          },
          {
            url: 'https://api.railnet.com',
            description: 'Production server',
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
          schemas: swaggerSchemas,
        },
        tags: [
          { name: 'Authentication', description: 'User registration and login' },
          { name: 'Stations', description: 'Railway station management' },
          { name: 'Train Routes', description: 'Train route creation and management' },
          { name: 'Compartments', description: 'Train compartment management' },
          { name: 'Trains', description: 'Train assembly and management' },
          { name: 'Train Schedules', description: 'Train schedule creation and search' },
          { name: 'Tickets', description: 'Ticket booking and management' },
          { name: 'Payments', description: 'SSLCommerz payment processing and booking cleanup' },
          { name: 'General', description: 'General API endpoints' },
        ],
      },
    });

    await app.register(fastifySwaggerUi, {
      routePrefix: '/documentation',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
        requestInterceptor: (req: any) => {
          // Add authorization header if token exists in localStorage (for browser testing)
          const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
          if (token) {
            req.headers.Authorization = `Bearer ${token}`;
          }
          return req;
        },
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
    });

    await app.register(fastifyJwt, {
      secret: process.env.JWT_SECRET || 'your-secret-key',
    });

    // Add JWT authentication decorators
    app.decorate('authenticate', async (request: any, reply: any) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        return reply.code(401).send({ error: 'Authentication required' });
      }
    });

    app.decorate('requireAdmin', async (request: any, reply: any) => {
      try {
        await request.jwtVerify();
        const user = request.user as { role: string };
        if (user.role !== 'admin') {
          return reply.code(403).send({ error: 'Admin access required' });
        }
      } catch (err: any) {
        if (err.code === 'FAST_JWT_INVALID_SIGNATURE' || err.code === 'FAST_JWT_MALFORMED') {
          return reply.code(401).send({ error: 'Authentication required' });
        }
        return reply.code(403).send({ error: 'Admin access required' });
      }
    });

    // Register routes
    app.register(authRoutes);
    app.register(stationRoutes);
    app.register(trainRouteRoutes);
    app.register(compartmentRoutes);
    app.register(trainRoutes);
    app.register(trainScheduleRoutes);
    app.register(ticketRoutes);
    app.register(paymentRoutes);

    // Root route
    app.get('/', {
      schema: {
        description: 'Root endpoint',
        tags: ['General'],
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    }, async (request, reply) => {
      return { message: 'RailNet Backend API' };
    });
    await app.listen({ port: parseInt(process.env.PORT || '3000'), host: '0.0.0.0' });
    app.log.info(`Server running on http://localhost:${process.env.PORT || '3000'}`);
    app.log.info(`API documentation available at http://localhost:${process.env.PORT || '3000'}/documentation`);

    // Start cleanup jobs
    cleanupJobs.start();
    app.log.info('Cleanup jobs started');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();