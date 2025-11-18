/**
 * Routes registry for RailNet Backend
 * Centralizes all route registrations with proper versioning and organization
 */

import { FastifyInstance } from 'fastify';
import { config } from '../config';
import { appLogger } from '../logger';

// Import route modules
import { createHealthRoutes } from '../../features/health/routes';
import { createAuthRoutes } from '../../features/auth/routes';
import { createStationRoutes } from '../../features/stations/routes';
import { createCoachTypeRoutes } from '../../features/coach-types/routes';

/**
 * Register all application routes
 * Routes are automatically versioned and prefixed
 */
export async function registerRoutes(server: FastifyInstance): Promise<void> {
  const apiPrefix = config.api.prefix;
  const version = config.api.version;

  appLogger.info('Registering application routes', {
    prefix: `${apiPrefix}/${version}`,
  });

  // Register routes under API versioning
  await server.register(
    async (apiServer) => {
      // Authentication routes
      apiServer.register(createAuthRoutes(), { prefix: '/auth' });

      // Station routes
      apiServer.register(createStationRoutes(), { prefix: '/stations' });

      // Coach type routes
      apiServer.register(createCoachTypeRoutes(), { prefix: '/coach-types' });

      // Future route modules can be added here
      // apiServer.register(createUserRoutes(), { prefix: '/users' });
      // apiServer.register(createAdminRoutes(), { prefix: '/admin' });
      // apiServer.register(createRailwayRoutes(), { prefix: '/railways' });

      appLogger.info('All route modules registered successfully');
    },
    {
      prefix: `${apiPrefix}/${version}`,
    }
  );

  // Register health routes at root level for load balancers and monitoring
  server.register(createHealthRoutes(), { prefix: '/health' });

  appLogger.info('Routes registration completed');
}

/**
 * Route registration helper for feature modules
 * Ensures consistent route registration patterns
 */
export class RouteRegistry {
  private static registeredRoutes: Array<{
    name: string;
    prefix: string;
    routes: number;
  }> = [];

  /**
   * Register a route module
   */
  static register(
    server: FastifyInstance,
    routeModule: () => Promise<unknown>,
    options: {
      prefix: string;
      name?: string;
    }
  ): void {
    const { prefix, name = prefix.replace('/', '') } = options;

    this.registeredRoutes.push({
      name,
      prefix,
      routes: 0, // Will be updated after registration
    });

    server.register(routeModule, { prefix });

    appLogger.debug(`Route module registered: ${name}`, { prefix });
  }

  /**
   * Get registered routes information
   */
  static getRegisteredRoutes(): Array<{
    name: string;
    prefix: string;
    routes: number;
  }> {
    return this.registeredRoutes;
  }

  /**
   * Clear registered routes (for testing)
   */
  static clear(): void {
    this.registeredRoutes = [];
  }
}