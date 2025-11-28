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
          description: `A comprehensive railway management system API built with Fastify and TypeScript.

## Features
- **Authentication**: JWT-based user authentication with role-based access control
- **Station Management**: CRUD operations for railway stations
- **Train Route Management**: Create and manage train routes with station sequences
- **Compartment Management**: Manage different train compartments with pricing
- **Train Assembly**: Build trains by combining routes and compartments
- **Schedule Management**: Create train schedules with station-specific timing
- **Train Search**: Search for available trains between stations
- **Ticket Booking**: Complete ticket booking system with seat management

## Authentication
All endpoints except authentication require a valid JWT token in the Authorization header:
\`Authorization: Bearer <your-jwt-token>\`

## Data Models
The API uses PostgreSQL with Prisma ORM and includes comprehensive relationships between:
- Users, Stations, Train Routes, Compartments, Trains, Schedules, and Tickets`,
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
          schemas: {
            Error: {
              type: 'object',
              properties: {
                error: {
                  type: 'string',
                  description: 'Error message',
                },
              },
              required: ['error'],
            },
            User: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                email: { type: 'string', format: 'email' },
                name: { type: 'string' },
                role: { type: 'string', enum: ['user', 'admin'] },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
            Station: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                code: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
            Compartment: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                class: { type: 'string', enum: ['Economy', 'Business', 'First'] },
                type: { type: 'string' },
                capacity: { type: 'number' },
                price: { type: 'number' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        tags: [
          { name: 'Authentication', description: 'User registration and login' },
          { name: 'Stations', description: 'Railway station management' },
          { name: 'Train Routes', description: 'Train route creation and management' },
          { name: 'Compartments', description: 'Train compartment management' },
          { name: 'Trains', description: 'Train assembly and management' },
          { name: 'Train Schedules', description: 'Train schedule creation and search' },
          { name: 'Tickets', description: 'Ticket booking and management' },
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
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();