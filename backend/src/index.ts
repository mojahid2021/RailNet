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
          description: 'Professional Fastify API with authentication',
          version: '1.0.0',
        },
        servers: [
          {
            url: 'http://localhost:3000',
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

    await app.register(fastifySwaggerUi, {
      routePrefix: '/documentation',
      uiConfig: {
        docExpansion: 'full',
        deepLinking: false,
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