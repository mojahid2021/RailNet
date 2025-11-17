/**
 * Health check routes for RailNet Backend
 * Provides basic and detailed health check endpoints
 */

import { FastifyPluginAsync } from 'fastify';
import { checkDatabaseHealth } from '../../core/database';
import { appLogger } from '../../core/logger';
import { HTTP_STATUS } from '../../shared/constants';
import { SystemHealth } from '../../types/common';

/**
 * Health check routes
 */
export const createHealthRoutes = (): FastifyPluginAsync => {
  return async (server) => {
    /**
     * Basic health check endpoint
     * Used by load balancers and monitoring systems
     */
    server.get('/', {
      schema: {
        description: 'Basic health check endpoint',
        tags: ['Health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['healthy', 'unhealthy'] },
              timestamp: { type: 'string', format: 'date-time' },
              uptime: { type: 'number' },
              environment: { type: 'string' },
              version: { type: 'string' },
              checks: {
                type: 'object',
                properties: {
                  database: { type: 'string' },
                },
              },
            },
          },
          503: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['unhealthy'] },
              timestamp: { type: 'string', format: 'date-time' },
              uptime: { type: 'number' },
              environment: { type: 'string' },
              checks: {
                type: 'object',
                properties: {
                  database: { type: 'string' },
                },
              },
              error: { type: 'string' },
            },
          },
        },
      },
    }, async (request, reply) => {
      const startTime = Date.now();

      try {
        // Check database health
        const dbHealth = await checkDatabaseHealth();

        const healthResponse = {
          status: dbHealth.status,
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: process.env.NODE_ENV || 'development',
          version: process.env.npm_package_version || '1.0.0',
          checks: {
            database: dbHealth.status === 'healthy' ? 'connected' : 'disconnected',
          },
          responseTime: `${Date.now() - startTime}ms`,
        };

        const statusCode = dbHealth.status === 'healthy' ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;

        return reply.status(statusCode).send(healthResponse);

      } catch (error) {
        appLogger.error('Health check failed', { error });

        const errorResponse = {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: process.env.NODE_ENV || 'development',
          checks: {
            database: 'error',
          },
          error: error instanceof Error ? error.message : 'Unknown error',
          responseTime: `${Date.now() - startTime}ms`,
        };

        return reply.status(HTTP_STATUS.SERVICE_UNAVAILABLE).send(errorResponse);
      }
    });

    /**
     * Detailed health check endpoint
     * Provides comprehensive system and service health information
     */
    server.get('/detailed', {
      schema: {
        description: 'Detailed health check with system information',
        tags: ['Health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['healthy', 'unhealthy', 'degraded'] },
              timestamp: { type: 'string', format: 'date-time' },
              uptime: { type: 'number' },
              environment: { type: 'string' },
              version: { type: 'string' },
              checks: {
                type: 'object',
                properties: {
                  database: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      latency: { type: 'string' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                  system: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      memory: {
                        type: 'object',
                        properties: {
                          rss: { type: 'string' },
                          heapUsed: { type: 'string' },
                          heapTotal: { type: 'string' },
                          external: { type: 'string' },
                        },
                      },
                      platform: { type: 'string' },
                      nodeVersion: { type: 'string' },
                    },
                  },
                },
              },
              responseTime: { type: 'string' },
            },
          },
        },
      },
    }, async (request, reply) => {
      const startTime = Date.now();

      try {
        // Database health check with timing
        const dbHealth = await checkDatabaseHealth();

        // System information
        const memUsage = process.memoryUsage();

        const detailedHealth: SystemHealth = {
          status: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
          timestamp: new Date(),
          uptime: process.uptime(),
          memory: {
            rss: memUsage.rss,
            heapTotal: memUsage.heapTotal,
            heapUsed: memUsage.heapUsed,
            external: memUsage.external,
            arrayBuffers: memUsage.arrayBuffers || 0,
          },
          checks: [
            {
              name: 'database',
              status: dbHealth.status,
              responseTime: dbHealth.latency,
              timestamp: new Date(),
              message: dbHealth.status === 'healthy' ? 'Database connection successful' : dbHealth.error,
            },
            {
              name: 'system',
              status: 'healthy',
              timestamp: new Date(),
              message: 'System resources normal',
            },
          ],
        };

        // Convert to API response format
        const response = {
          status: detailedHealth.status,
          timestamp: detailedHealth.timestamp.toISOString(),
          uptime: detailedHealth.uptime,
          environment: process.env.NODE_ENV || 'development',
          version: process.env.npm_package_version || '1.0.0',
          checks: {
            database: {
              status: detailedHealth.checks[0].status,
              latency: detailedHealth.checks[0].responseTime ? `${detailedHealth.checks[0].responseTime}ms` : undefined,
              timestamp: detailedHealth.checks[0].timestamp.toISOString(),
              ...(detailedHealth.checks[0].message && { message: detailedHealth.checks[0].message }),
            },
            system: {
              status: detailedHealth.checks[1].status,
              memory: {
                rss: `${Math.round(detailedHealth.memory.rss / 1024 / 1024)}MB`,
                heapUsed: `${Math.round(detailedHealth.memory.heapUsed / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(detailedHealth.memory.heapTotal / 1024 / 1024)}MB`,
                external: `${Math.round(detailedHealth.memory.external / 1024 / 1024)}MB`,
              },
              platform: process.platform,
              nodeVersion: process.version,
              timestamp: detailedHealth.checks[1].timestamp.toISOString(),
            },
          },
          responseTime: `${Date.now() - startTime}ms`,
        };

        const statusCode = detailedHealth.status === 'healthy' ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;

        return reply.status(statusCode).send(response);

      } catch (error) {
        appLogger.error('Detailed health check failed', { error });

        const errorResponse = {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: process.env.NODE_ENV || 'development',
          checks: {
            database: {
              status: 'unhealthy',
              timestamp: new Date().toISOString(),
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            system: {
              status: 'unknown',
              timestamp: new Date().toISOString(),
            },
          },
          responseTime: `${Date.now() - startTime}ms`,
        };

        return reply.status(HTTP_STATUS.SERVICE_UNAVAILABLE).send(errorResponse);
      }
    });

    /**
     * Readiness check endpoint
     * Used by Kubernetes and orchestration systems to determine if the service is ready to receive traffic
     */
    server.get('/ready', {
      schema: {
        description: 'Readiness check for container orchestration',
        tags: ['Health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['ready'] },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
          503: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['not ready'] },
              timestamp: { type: 'string', format: 'date-time' },
              reason: { type: 'string' },
            },
          },
        },
      },
    }, async (request, reply) => {
      try {
        // Check if database is accessible
        await checkDatabaseHealth();

        return reply.status(HTTP_STATUS.OK).send({
          status: 'ready',
          timestamp: new Date().toISOString(),
        });

      } catch {
        return reply.status(HTTP_STATUS.SERVICE_UNAVAILABLE).send({
          status: 'not ready',
          timestamp: new Date().toISOString(),
          reason: 'Database connection failed',
        });
      }
    });

    appLogger.debug('Health routes registered', {
      routes: ['GET /', 'GET /detailed', 'GET /ready'],
    });
  };
};