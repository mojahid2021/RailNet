import { FastifyInstance } from 'fastify';

/**
 * Health route
 * - GET /health
 * - Response: { status: 'ok' | 'fail', uptime: number, timestamp: string }
 *
 * Folderized under `src/routes/health` so each route can grow its own
 * handlers, schemas and tests independently.
 */
const healthRoute = async (server: FastifyInstance) => {
  server.get(
    '/health',
    {
      schema: {
        description: 'Health check endpoint',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              uptime: { type: 'number' },
              timestamp: { type: 'string' }
            },
            required: ['status', 'uptime', 'timestamp']
          }
        }
      }
    },
    async (request, reply) => {
      // lightweight health response (suitable for k8s readiness/liveness)
      return {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      };
    }
  );
};

export default healthRoute;
