import { FastifyPluginAsync } from 'fastify';
import { HealthController } from '../../controllers/health.controller';
import { HealthService } from '../../services/health.service';

/**
 * Health route (plugin style)
 * - GET /health
 * - Response: HealthStatus
 */
const healthRoute: FastifyPluginAsync = async (server) => {
  const healthService = new HealthService();
  const healthController = new HealthController(healthService);

  server.get(
    '/health',
    {
      schema: {
        description: 'Health check endpoint',
        tags: ['Health'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  uptime: { type: 'number' },
                  timestamp: { type: 'string' },
                  environment: { type: 'string' },
                  database: { type: 'string' },
                  version: { type: 'string' },
                },
              },
              timestamp: { type: 'string' },
            },
          },
          503: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  code: { type: 'string' },
                },
              },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    (request, reply) => healthController.check(request, reply)
  );
};

export default healthRoute;
