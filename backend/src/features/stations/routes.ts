/**
 * Station routes for RailNet Backend
 * Handles station management operations (admin only)
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { appLogger } from '../../core/logger';
import { HTTP_STATUS } from '../../shared/constants';
import { StationService, CreateStationData } from './service';

// Validation schemas
const createStationSchema = z.object({
  name: z.string().min(1, 'Station name is required').max(100, 'Station name too long'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

const updateStationSchema = z.object({
  name: z.string().min(1, 'Station name is required').max(100, 'Station name too long').optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

/**
 * Station routes (admin only)
 */
export const createStationRoutes = (): FastifyPluginAsync => {
  return async (server) => {
    // Initialize station service
    const stationService = new StationService();

    /**
     * Create a new station (admin only)
     */
    server.post('/admin/stations', {
      schema: {
        description: 'Create a new railway station (admin only)',
        tags: ['Stations'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            latitude: { type: 'number', minimum: -90, maximum: 90 },
            longitude: { type: 'number', minimum: -180, maximum: 180 },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  station: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      code: { type: 'string' },
                      city: { type: 'string' },
                      state: { type: 'string' },
                      country: { type: 'string' },
                      latitude: { type: 'number' },
                      longitude: { type: 'number' },
                      isActive: { type: 'boolean' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
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
              message: 'Only administrators can create stations',
            },
            timestamp: new Date().toISOString(),
          });
        }

        // Validate request body
        const validation = createStationSchema.safeParse(request.body);
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

        const stationData: CreateStationData = validation.data;

        // Create station
        const station = await stationService.createStation(stationData);

        appLogger.info('Station created successfully', {
          stationId: station.id,
          stationName: station.name,
          stationCode: station.code,
          createdBy: user.userId,
        });

        return reply.status(HTTP_STATUS.CREATED).send({
          success: true,
          message: 'Station created successfully',
          data: { station },
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Station creation failed', { error });

        return reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: {
            code: (error as { code?: string }).code || 'STATION_CREATION_ERROR',
            message: (error as { message?: string }).message || 'Station creation failed',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Get all stations
     */
    server.get('/stations', {
      schema: {
        description: 'Get all active railway stations',
        tags: ['Stations'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
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
                    latitude: { type: 'number' },
                    longitude: { type: 'number' },
                    isActive: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
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
        const stations = await stationService.getAllStations();

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          data: stations,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Failed to get stations', { error });

        return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
          success: false,
          error: {
            code: 'STATIONS_FETCH_ERROR',
            message: 'Failed to retrieve stations',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Get station by ID
     */
    server.get('/stations/:id', {
      schema: {
        description: 'Get station by ID',
        tags: ['Stations'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  code: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  country: { type: 'string' },
                  latitude: { type: 'number' },
                  longitude: { type: 'number' },
                  isActive: { type: 'boolean' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
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
        const { id } = request.params as { id: string };
        const station = await stationService.getStationById(id);

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          data: station,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Failed to get station by ID', { error, stationId: (request.params as { id: string }).id });

        const statusCode = (error as { name?: string }).name === 'NotFoundError' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;

        return reply.status(statusCode).send({
          success: false,
          error: {
            code: (error as { name?: string }).name === 'NotFoundError' ? 'STATION_NOT_FOUND' : 'STATION_FETCH_ERROR',
            message: (error as { message?: string }).message || 'Failed to retrieve station',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Search stations
     */
    server.get('/stations/search/:query', {
      schema: {
        description: 'Search stations by name, code, or city',
        tags: ['Stations'],
        params: {
          type: 'object',
          properties: {
            query: { type: 'string', minLength: 1 },
          },
          required: ['query'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
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
                    latitude: { type: 'number' },
                    longitude: { type: 'number' },
                    isActive: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
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
        const { query } = request.params as { query: string };
        const stations = await stationService.searchStations(query);

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          data: stations,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Failed to search stations', { error, query: (request.params as { query: string }).query });

        return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
          success: false,
          error: {
            code: 'STATIONS_SEARCH_ERROR',
            message: 'Failed to search stations',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Update station (admin only)
     */
    server.put('/admin/stations/:id', {
      schema: {
        description: 'Update station information (admin only)',
        tags: ['Stations'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            latitude: { type: 'number', minimum: -90, maximum: 90 },
            longitude: { type: 'number', minimum: -180, maximum: 180 },
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
                  station: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      code: { type: 'string' },
                      city: { type: 'string' },
                      state: { type: 'string' },
                      country: { type: 'string' },
                      latitude: { type: 'number' },
                      longitude: { type: 'number' },
                      isActive: { type: 'boolean' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                    },
                  },
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
        const user = request.user as { userId: string; email: string; role: string };

        // Check if user is admin
        if (user.role !== 'ADMIN') {
          return reply.status(HTTP_STATUS.FORBIDDEN).send({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Only administrators can update stations',
            },
            timestamp: new Date().toISOString(),
          });
        }

        const { id } = request.params as { id: string };

        // Validate request body
        const validation = updateStationSchema.safeParse(request.body);
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

        // Update station
        const station = await stationService.updateStation(id, validation.data);

        appLogger.info('Station updated successfully', {
          stationId: station.id,
          stationName: station.name,
          updatedBy: user.userId,
        });

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          message: 'Station updated successfully',
          data: { station },
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Station update failed', { error, stationId: (request.params as { id: string }).id });

        const statusCode = (error as { name?: string }).name === 'NotFoundError' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;

        return reply.status(statusCode).send({
          success: false,
          error: {
            code: (error as { name?: string }).name === 'NotFoundError' ? 'STATION_NOT_FOUND' : 'STATION_UPDATE_ERROR',
            message: (error as { message?: string }).message || 'Station update failed',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Deactivate station (admin only)
     */
    server.delete('/admin/stations/:id', {
      schema: {
        description: 'Deactivate a station (admin only)',
        tags: ['Stations'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
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
        const user = request.user as { userId: string; email: string; role: string };

        // Check if user is admin
        if (user.role !== 'ADMIN') {
          return reply.status(HTTP_STATUS.FORBIDDEN).send({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Only administrators can deactivate stations',
            },
            timestamp: new Date().toISOString(),
          });
        }

        const { id } = request.params as { id: string };

        // Deactivate station
        await stationService.deactivateStation(id);

        appLogger.info('Station deactivated successfully', {
          stationId: id,
          deactivatedBy: user.userId,
        });

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          message: 'Station deactivated successfully',
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Station deactivation failed', { error, stationId: (request.params as { id: string }).id });

        const statusCode = (error as { name?: string }).name === 'NotFoundError' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;

        return reply.status(statusCode).send({
          success: false,
          error: {
            code: (error as { name?: string }).name === 'NotFoundError' ? 'STATION_NOT_FOUND' : 'STATION_DEACTIVATION_ERROR',
            message: (error as { message?: string }).message || 'Station deactivation failed',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    appLogger.debug('Station routes registered', {
      routes: [
        'POST /admin/stations',
        'GET /stations',
        'GET /stations/:id',
        'GET /stations/search/:query',
        'PUT /admin/stations/:id',
        'DELETE /admin/stations/:id'
      ],
    });
  };
};