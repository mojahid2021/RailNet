/**
 * Route routes for RailNet Backend
 * Handles route management operations (admin only)
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { appLogger } from '../../core/logger';
import { HTTP_STATUS } from '../../shared/constants';
import { RouteService } from './service';
import { CreateRouteData, UpdateRouteData, RouteFilters } from '../../types/common';
import { NotFoundError } from '../../shared/errors';

// Validation schemas
const createRouteStopSchema = z.object({
  stationId: z.string().min(1, 'Station ID is required'),
  arrivalTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Arrival time must be in HH:MM format').nullable().optional(),
  departureTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Departure time must be in HH:MM format').nullable().optional(),
  distanceFromStart: z.number().min(0, 'Distance from start must be non-negative'),
  platform: z.string().max(10, 'Platform too long').nullable().optional(),
});

const createRouteSchema = z.object({
  name: z.string().min(1, 'Route name is required').max(100, 'Route name too long'),
  distance: z.number().min(0, 'Distance must be non-negative'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  stops: z.array(createRouteStopSchema).min(2, 'Route must have at least 2 stops'),
});

const createRoutesSchema = z.object({
  routes: z.array(createRouteSchema).min(1, 'At least one route is required'),
});

const updateRouteSchema = z.object({
  name: z.string().min(1, 'Route name is required').max(100, 'Route name too long').optional(),
  distance: z.number().min(0, 'Distance must be non-negative').optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute').optional(),
  isActive: z.boolean().optional(),
});

const routeFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  stationId: z.string().optional(),
  minDistance: z.number().min(0).optional(),
  maxDistance: z.number().min(0).optional(),
  minDuration: z.number().min(1).optional(),
  maxDuration: z.number().min(1).optional(),
  sortBy: z.enum(['name', 'distance', 'duration', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Route routes (admin only)
 */
export const createRouteRoutes = (): FastifyPluginAsync => {
  return async (server) => {
    // Initialize route service
    const routeService = new RouteService();

    /**
     * Create multiple routes with their stops (admin only)
     */
    server.post('/admin', {
      schema: {
        description: 'Create multiple routes with their stops (admin only)',
        tags: ['Routes'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['routes'],
          properties: {
            routes: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['name', 'stops'],
                properties: {
                  name: { type: 'string', minLength: 1, maxLength: 100 },
                  distance: { type: 'number', minimum: 0 },
                  duration: { type: 'number', minimum: 1 },
                  stops: {
                    type: 'array',
                    minItems: 2,
                    items: {
                      type: 'object',
                      required: ['stationId', 'stopOrder'],
                      properties: {
                        stationId: { type: 'string' },
                        stopOrder: { type: 'number', minimum: 1 },
                        arrivalTime: { type: 'string' },
                        departureTime: { type: 'string' },
                        distance: { type: 'number', minimum: 0 },
                        platform: { type: 'string' },
                      },
                    },
                  },
                  isActive: { type: 'boolean' },
                },
              },
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  route: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      code: { type: 'string' },
                      distance: { type: 'number' },
                      duration: { type: 'number' },
                      isActive: { type: 'boolean' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                      trainCount: { type: 'number' },
                      averageSpeed: { type: 'number' },
                      stopCount: { type: 'number' },
                      stations: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            code: { type: 'string' },
                            city: { type: 'string' },
                            state: { type: 'string' },
                            country: { type: 'string' },
                          },
                        },
                      },
                      stops: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            stationId: { type: 'string' },
                            stopOrder: { type: 'number' },
                            arrivalTime: { type: 'string' },
                            departureTime: { type: 'string' },
                            distance: { type: 'number' },
                            distanceFromStart: { type: 'number' },
                            platform: { type: 'string' },
                            station: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                code: { type: 'string' },
                                city: { type: 'string' },
                                state: { type: 'string' },
                                country: { type: 'string' },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                  details: { type: 'array' },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
          403: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      preHandler: (server as unknown as { auth: Function; authenticate: Function }).auth([(server as unknown as { auth: Function; authenticate: Function }).authenticate]),
    }, async (request, reply) => {
      try {
        const user = request.user as { userId: string; email: string; role: string };

        // Check if user is admin
        if (user.role !== 'ADMIN') {
          return reply.status(HTTP_STATUS.FORBIDDEN).send({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Only administrators can create routes',
            },
            timestamp: new Date().toISOString(),
          });
        }

        // Validate request body
        const validation = createRoutesSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(HTTP_STATUS.BAD_REQUEST).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input data',
              details: validation.error.issues,
            },
            timestamp: new Date().toISOString(),
          });
        }

        const { routes: routesData } = validation.data;

        // Create routes
        const routes = await routeService.createRoutes(routesData);

        appLogger.info('Routes created successfully', {
          routeCount: routes.length,
          userId: user.userId,
        });

        return reply.status(HTTP_STATUS.CREATED).send({
          success: true,
          message: `${routes.length} route(s) created successfully`,
          data: { routes },
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Route creation failed', { error, userId: (request.user as { userId: string })?.userId });

        if (error instanceof Error) {
          return reply.status(HTTP_STATUS.BAD_REQUEST).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: error.message,
            },
            timestamp: new Date().toISOString(),
          });
        }

        return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Update route (admin only)
     */
    server.put('/admin/:routeId', {
      schema: {
        description: 'Update route information (admin only)',
        tags: ['Routes'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['routeId'],
          properties: {
            routeId: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            distance: { type: 'number', minimum: 0 },
            duration: { type: 'number', minimum: 1 },
            isActive: { type: 'boolean' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  route: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      distance: { type: 'number' },
                      duration: { type: 'number' },
                      isActive: { type: 'boolean' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                      trainCount: { type: 'number' },
                      stations: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            code: { type: 'string' },
                            city: { type: 'string' },
                            state: { type: 'string' },
                            country: { type: 'string' },
                          },
                        },
                      },
                      stops: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            stationId: { type: 'string' },
                            stopOrder: { type: 'number' },
                            arrivalTime: { type: 'string' },
                            departureTime: { type: 'string' },
                            distance: { type: 'number' },
                            distanceFromStart: { type: 'number' },
                            platform: { type: 'string' },
                            station: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                code: { type: 'string' },
                                city: { type: 'string' },
                                state: { type: 'string' },
                                country: { type: 'string' },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      preHandler: (server as unknown as { auth: Function; authenticate: Function }).auth([(server as unknown as { auth: Function; authenticate: Function }).authenticate]),
    }, async (request, reply) => {
      try {
        const { routeId } = request.params as { routeId: string };
        const validation = updateRouteSchema.safeParse(request.body);

        if (!validation.success) {
          return reply.status(HTTP_STATUS.BAD_REQUEST).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data',
              details: validation.error.issues,
            },
            timestamp: new Date().toISOString(),
          });
        }

        const route = await routeService.updateRoute(routeId, validation.data);

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          message: 'Route updated successfully',
          data: { route },
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Update route failed', { error });

        if (error instanceof NotFoundError) {
          return reply.status(HTTP_STATUS.NOT_FOUND).send({
            success: false,
            error: {
              code: 'ROUTE_NOT_FOUND',
              message: error.message,
            },
            timestamp: new Date().toISOString(),
          });
        }

        return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Delete route (admin only)
     */
    server.delete('/admin/:routeId', {
      schema: {
        description: 'Delete route (admin only)',
        tags: ['Routes'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['routeId'],
          properties: {
            routeId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      preHandler: (server as unknown as { auth: Function; authenticate: Function }).auth([(server as unknown as { auth: Function; authenticate: Function }).authenticate]),
    }, async (request, reply) => {
      try {
        const { routeId } = request.params as { routeId: string };

        await routeService.deleteRoute(routeId);

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          message: 'Route deleted successfully',
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Delete route failed', { error });

        if (error instanceof NotFoundError) {
          return reply.status(HTTP_STATUS.NOT_FOUND).send({
            success: false,
            error: {
              code: 'ROUTE_NOT_FOUND',
              message: error.message,
            },
            timestamp: new Date().toISOString(),
          });
        }

        return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Get routes with filters
     */
    server.get('/', {
      schema: {
        description: 'Get routes with optional filters',
        tags: ['Routes'],
        querystring: {
          type: 'object',
          properties: {
            isActive: { type: 'boolean' },
            search: { type: 'string' },
            stationId: { type: 'string' },
            minDistance: { type: 'number', minimum: 0 },
            maxDistance: { type: 'number', minimum: 0 },
            minDuration: { type: 'number', minimum: 1 },
            maxDuration: { type: 'number', minimum: 1 },
            sortBy: { type: 'string', enum: ['name', 'distance', 'duration', 'createdAt'] },
            sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  routes: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        distance: { type: 'number' },
                        duration: { type: 'number' },
                        isActive: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                        trainCount: { type: 'number' },
                        averageSpeed: { type: 'number' },
                        stopCount: { type: 'number' },
                        code: { type: 'string' },
                        stations: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                              code: { type: 'string' },
                              city: { type: 'string' },
                              state: { type: 'string' },
                              country: { type: 'string' },
                            },
                          },
                        },
                        stops: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              stationId: { type: 'string' },
                              stopOrder: { type: 'number' },
                              arrivalTime: { type: 'string' },
                              departureTime: { type: 'string' },
                              distance: { type: 'number' },
                              distanceFromStart: { type: 'number' },
                              platform: { type: 'string' },
                              station: {
                                type: 'object',
                                properties: {
                                  id: { type: 'string' },
                                  name: { type: 'string' },
                                  code: { type: 'string' },
                                  city: { type: 'string' },
                                  state: { type: 'string' },
                                  country: { type: 'string' },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    }, async (request, reply) => {
      try {
        const filters = request.query as RouteFilters;
        const routes = await routeService.getAllRoutes(filters);

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          message: `${routes.length} route(s) retrieved successfully`,
          data: { routes },
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Get routes failed', { error });

        return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Get routes by station ID
     */
    server.get('/station/:stationId', {
      schema: {
        description: 'Get routes that include a specific station',
        tags: ['Routes'],
        params: {
          type: 'object',
          required: ['stationId'],
          properties: {
            stationId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  routes: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        distance: { type: 'number' },
                        duration: { type: 'number' },
                        isActive: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                        trainCount: { type: 'number' },
                        averageSpeed: { type: 'number' },
                        stopCount: { type: 'number' },
                        code: { type: 'string' },
                        stations: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                              code: { type: 'string' },
                              city: { type: 'string' },
                              state: { type: 'string' },
                              country: { type: 'string' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    }, async (request, reply) => {
      try {
        const { stationId } = request.params as { stationId: string };
        const routes = await routeService.getRoutesByStation(stationId);

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          message: `${routes.length} route(s) found for station`,
          data: { routes },
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Get routes by station failed', { error });

        return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Get route by ID
     */
    server.get('/:routeId', {
      schema: {
        description: 'Get route details by ID',
        tags: ['Routes'],
        params: {
          type: 'object',
          required: ['routeId'],
          properties: {
            routeId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  route: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      code: { type: 'string' },
                      distance: { type: 'number' },
                      duration: { type: 'number' },
                      isActive: { type: 'boolean' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                      trainCount: { type: 'number' },
                      averageSpeed: { type: 'number' },
                      stopCount: { type: 'number' },
                      stations: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            code: { type: 'string' },
                            city: { type: 'string' },
                            state: { type: 'string' },
                            country: { type: 'string' },
                          },
                        },
                      },
                      stops: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            routeId: { type: 'string' },
                            stationId: { type: 'string' },
                            stopOrder: { type: 'number' },
                            arrivalTime: { type: 'string' },
                            departureTime: { type: 'string' },
                            distance: { type: 'number' },
                            distanceFromStart: { type: 'number' },
                            prevStationId: { type: 'string' },
                            nextStationId: { type: 'string' },
                            station: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                code: { type: 'string' },
                                city: { type: 'string' },
                                state: { type: 'string' },
                                country: { type: 'string' },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    }, async (request, reply) => {
      try {
        const { routeId } = request.params as { routeId: string };

        const route = await routeService.getRouteById(routeId);

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          message: 'Route retrieved successfully',
          data: { route },
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Get route by ID failed', { error, routeId: (request.params as { routeId: string }).routeId });

        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(HTTP_STATUS.NOT_FOUND).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: error.message,
            },
            timestamp: new Date().toISOString(),
          });
        }

        return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });
  };
};