/**
 * Train routes for RailNet Backend
 * Handles train management operations
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { appLogger } from '../../core/logger';
import { HTTP_STATUS } from '../../shared/constants';
import { TrainService, CreateTrainData } from './service';

// Validation schemas
const coachConfigSchema = z.object({
  coachTypeCode: z.string().min(1, 'Coach type code is required').max(10, 'Coach type code too long'),
  count: z.number().int().min(1, 'At least 1 coach required').max(50, 'Too many coaches'),
});

const createTrainSchema = z.object({
  name: z.string().min(1, 'Train name is required').max(100, 'Train name too long'),
  number: z.string().min(1, 'Train number is required').max(10, 'Train number too long'),
  type: z.enum(['EXPRESS', 'SUPERFAST', 'MAIL', 'PASSENGER', 'SHATABDI', 'RAJDHANI'], {
    errorMap: () => ({ message: 'Invalid train type' }),
  }),
  routeId: z.string().uuid('Invalid route ID').optional(),
  coaches: z.array(coachConfigSchema).min(1, 'At least one coach configuration required'),
});

const updateTrainSchema = z.object({
  name: z.string().min(1, 'Train name is required').max(100, 'Train name too long').optional(),
  number: z.string().min(1, 'Train number is required').max(10, 'Train number too long').optional(),
  type: z.enum(['EXPRESS', 'SUPERFAST', 'MAIL', 'PASSENGER', 'SHATABDI', 'RAJDHANI'], {
    errorMap: () => ({ message: 'Invalid train type' }),
  }).optional(),
  routeId: z.string().uuid('Invalid route ID').optional(),
});

/**
 * Train routes
 */
export const createTrainRoutes = (): FastifyPluginAsync => {
  return async (server) => {
    // Initialize train service
    const trainService = new TrainService();

    /**
     * Create a new train (admin only)
     */
    server.post('/admin', {
      schema: {
        description: 'Create a new train (admin only)',
        tags: ['Trains'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name', 'number', 'type', 'coaches'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            number: { type: 'string', minLength: 1, maxLength: 10 },
            type: { type: 'string', enum: ['EXPRESS', 'SUPERFAST', 'MAIL', 'PASSENGER', 'SHATABDI', 'RAJDHANI'] },
            routeId: { type: 'string', format: 'uuid' },
            coaches: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['coachTypeCode', 'count'],
                properties: {
                  coachTypeCode: { type: 'string', minLength: 1, maxLength: 10 },
                  count: { type: 'number', minimum: 1, maximum: 50 },
                },
              },
            },
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
                  train: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      number: { type: 'string' },
                      type: { type: 'string' },
                      routeId: { type: 'string' },
                      totalSeats: { type: 'number' },
                      isActive: { type: 'boolean' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                      route: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          code: { type: 'string' },
                          distance: { type: 'number' },
                          duration: { type: 'number' },
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
              message: 'Only administrators can create trains',
            },
            timestamp: new Date().toISOString(),
          });
        }

        // Validate request body
        const validation = createTrainSchema.safeParse(request.body);
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

        const trainData: CreateTrainData = validation.data;

        // Create train
        const train = await trainService.createTrain(trainData);

        appLogger.info('Train created successfully', {
          trainId: train.id,
          trainNumber: train.number,
          trainName: train.name,
          createdBy: user.userId,
        });

        return reply.status(HTTP_STATUS.CREATED).send({
          success: true,
          message: 'Train created successfully',
          data: { train },
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Train creation failed', { error });

        return reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: {
            code: (error as { code?: string }).code || 'TRAIN_CREATION_ERROR',
            message: (error as { message?: string }).message || 'Train creation failed',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Get all trains
     */
    server.get('/', {
      schema: {
        description: 'Get all active trains',
        tags: ['Trains'],
        querystring: {
          type: 'object',
          properties: {
            includeCoaches: { type: 'boolean', default: false },
          },
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
                    number: { type: 'string' },
                    type: { type: 'string' },
                    routeId: { type: 'string' },
                    totalSeats: { type: 'number' },
                    isActive: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    route: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        code: { type: 'string' },
                        distance: { type: 'number' },
                        duration: { type: 'number' },
                      },
                    },
                    coaches: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          coachNumber: { type: 'string' },
                          totalSeats: { type: 'number' },
                          coachType: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                              code: { type: 'string' },
                              ratePerKm: { type: 'number' },
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
        const { includeCoaches = false } = request.query as { includeCoaches?: boolean };

        const trains = await trainService.getAllTrains(includeCoaches);

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          data: trains,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Failed to get all trains', { error });

        return reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: {
            code: 'GET_TRAINS_ERROR',
            message: 'Failed to get trains',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Get train by ID
     */
    server.get('/:id', {
      schema: {
        description: 'Get a train by ID',
        tags: ['Trains'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            includeCoaches: { type: 'boolean', default: false },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  train: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      number: { type: 'string' },
                      type: { type: 'string' },
                      routeId: { type: 'string' },
                      totalSeats: { type: 'number' },
                      isActive: { type: 'boolean' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                      route: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          code: { type: 'string' },
                          distance: { type: 'number' },
                          duration: { type: 'number' },
                        },
                      },
                      coaches: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            coachNumber: { type: 'string' },
                            totalSeats: { type: 'number' },
                            coachType: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                code: { type: 'string' },
                                ratePerKm: { type: 'number' },
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
        const { id } = request.params as { id: string };
        const { includeCoaches = false } = request.query as { includeCoaches?: boolean };

        const train = await trainService.getTrainById(id, includeCoaches);

        if (!train) {
          return reply.status(HTTP_STATUS.NOT_FOUND).send({
            success: false,
            error: {
              code: 'TRAIN_NOT_FOUND',
              message: 'Train not found',
            },
            timestamp: new Date().toISOString(),
          });
        }

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          data: { train },
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Failed to get train by ID', { error });

        return reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: {
            code: 'GET_TRAIN_ERROR',
            message: 'Failed to get train',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Get train by number
     */
    server.get('/number/:number', {
      schema: {
        description: 'Get a train by number',
        tags: ['Trains'],
        params: {
          type: 'object',
          required: ['number'],
          properties: {
            number: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            includeCoaches: { type: 'boolean', default: false },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  train: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      number: { type: 'string' },
                      type: { type: 'string' },
                      routeId: { type: 'string' },
                      totalSeats: { type: 'number' },
                      isActive: { type: 'boolean' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                      route: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          code: { type: 'string' },
                          distance: { type: 'number' },
                          duration: { type: 'number' },
                        },
                      },
                      coaches: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            coachNumber: { type: 'string' },
                            totalSeats: { type: 'number' },
                            coachType: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                code: { type: 'string' },
                                ratePerKm: { type: 'number' },
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
        const { number } = request.params as { number: string };
        const { includeCoaches = false } = request.query as { includeCoaches?: boolean };

        const train = await trainService.getTrainByNumber(number, includeCoaches);

        if (!train) {
          return reply.status(HTTP_STATUS.NOT_FOUND).send({
            success: false,
            error: {
              code: 'TRAIN_NOT_FOUND',
              message: 'Train not found',
            },
            timestamp: new Date().toISOString(),
          });
        }

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          data: { train },
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Failed to get train by number', { error });

        return reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: {
            code: 'GET_TRAIN_ERROR',
            message: 'Failed to get train',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Update train (admin only)
     */
    server.put('/admin/:id', {
      schema: {
        description: 'Update a train (admin only)',
        tags: ['Trains'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            number: { type: 'string', minLength: 1, maxLength: 10 },
            type: { type: 'string', enum: ['EXPRESS', 'SUPERFAST', 'MAIL', 'PASSENGER', 'SHATABDI', 'RAJDHANI'] },
            routeId: { type: 'string', format: 'uuid' },
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
                  train: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      number: { type: 'string' },
                      type: { type: 'string' },
                      routeId: { type: 'string' },
                      totalSeats: { type: 'number' },
                      isActive: { type: 'boolean' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                      route: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          code: { type: 'string' },
                          distance: { type: 'number' },
                          duration: { type: 'number' },
                        },
                      },
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
              message: 'Only administrators can update trains',
            },
            timestamp: new Date().toISOString(),
          });
        }

        const { id } = request.params as { id: string };

        // Validate request body
        const validation = updateTrainSchema.safeParse(request.body);
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

        const updateData = validation.data;

        // Update train
        const train = await trainService.updateTrain(id, updateData);

        appLogger.info('Train updated successfully', {
          trainId: train.id,
          updatedBy: user.userId,
        });

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          message: 'Train updated successfully',
          data: { train },
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Train update failed', { error });

        if ((error as { message?: string }).message?.includes('not found')) {
          return reply.status(HTTP_STATUS.NOT_FOUND).send({
            success: false,
            error: {
              code: 'TRAIN_NOT_FOUND',
              message: 'Train not found',
            },
            timestamp: new Date().toISOString(),
          });
        }

        return reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: {
            code: 'TRAIN_UPDATE_ERROR',
            message: (error as { message?: string }).message || 'Train update failed',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Delete train (admin only)
     */
    server.delete('/admin/:id', {
      schema: {
        description: 'Delete a train (admin only)',
        tags: ['Trains'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
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
              message: 'Only administrators can delete trains',
            },
            timestamp: new Date().toISOString(),
          });
        }

        const { id } = request.params as { id: string };

        // Delete train
        await trainService.deleteTrain(id);

        appLogger.info('Train deleted successfully', {
          trainId: id,
          deletedBy: user.userId,
        });

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          message: 'Train deleted successfully',
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Train deletion failed', { error });

        if ((error as { message?: string }).message?.includes('not found')) {
          return reply.status(HTTP_STATUS.NOT_FOUND).send({
            success: false,
            error: {
              code: 'TRAIN_NOT_FOUND',
              message: 'Train not found',
            },
            timestamp: new Date().toISOString(),
          });
        }

        return reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: {
            code: 'TRAIN_DELETION_ERROR',
            message: 'Train deletion failed',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Get trains by route
     */
    server.get('/route/:routeId', {
      schema: {
        description: 'Get all trains for a specific route',
        tags: ['Trains'],
        params: {
          type: 'object',
          required: ['routeId'],
          properties: {
            routeId: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            includeCoaches: { type: 'boolean', default: false },
          },
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
                    number: { type: 'string' },
                    type: { type: 'string' },
                    routeId: { type: 'string' },
                    totalSeats: { type: 'number' },
                    isActive: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    route: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        code: { type: 'string' },
                        distance: { type: 'number' },
                        duration: { type: 'number' },
                      },
                    },
                    coaches: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          coachNumber: { type: 'string' },
                          totalSeats: { type: 'number' },
                          coachType: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                              code: { type: 'string' },
                              ratePerKm: { type: 'number' },
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
        const { routeId } = request.params as { routeId: string };
        const { includeCoaches = false } = request.query as { includeCoaches?: boolean };

        const trains = await trainService.getTrainsByRoute(routeId, includeCoaches);

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          data: trains,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Failed to get trains by route', { error });

        return reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: {
            code: 'GET_TRAINS_ERROR',
            message: 'Failed to get trains',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });
  };
};