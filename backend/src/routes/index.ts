import { FastifyInstance } from 'fastify';
import { config } from '../config';
import healthRoute from './health/health';
import helloRoute from './hello/hello';

/**
 * Register all routes for the application.
 * Routes are versioned under /api/v1/
 */
export const registerRoutes = async (server: FastifyInstance) => {
  const apiPrefix = config.api.prefix;
  const version = config.api.version;

  // Register routes under API versioning
  server.register(
    async (instance) => {
      // Register route plugins
      instance.register(healthRoute);
      instance.register(helloRoute);
    },
    {
      prefix: `${apiPrefix}/${version}`,
    }
  );

  // Also register health route at root level for load balancers
  server.register(healthRoute, { prefix: '/health' });
};

export default registerRoutes;
