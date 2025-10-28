import { FastifyInstance } from 'fastify';
import healthRoute from './health/health';

/**
 * Register all routes for the application.
 * Keep this file as the single entry-point for route registration so
 * callers (server / tests) can register routes in a single call.
 */
export const registerRoutes = async (server: FastifyInstance) => {
  // add other routes here as the project grows
  await healthRoute(server);
};

export default registerRoutes;
