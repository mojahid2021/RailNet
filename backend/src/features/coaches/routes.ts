/**
 * Coach routes for RailNet Backend
 * Handles coach management operations
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { appLogger } from '../../core/logger';
import { HTTP_STATUS } from '../../shared/constants';
import { CoachService, CreateCoachData } from './service';

// Validation schemas
const createCoachSchema = z.object({
  trainId: z.string().min(1, 'Train ID is required'),
  coachTypeId: z.string().min(1, 'Coach type ID is required'),
  coachNumber: z.string().min(1, 'Coach number is required').max(10, 'Coach number too long'),
  totalSeats: z.number().int().min(1, 'Total seats must be at least 1').max(200, 'Total seats too high'),
});

const updateCoachSchema = z.object({
  coachTypeId: z.string().min(1, 'Coach type ID is required').optional(),
  coachNumber: z.string().min(1, 'Coach number is required').max(10, 'Coach number too long').optional(),
  totalSeats: z.number().int().min(1, 'Total seats must be at least 1').max(200, 'Total seats too high').optional(),
});

/**
 * Coach routes
 */
export const createCoachRoutes = (): FastifyPluginAsync => {
  return async (server) => {
    // Initialize coach service
    const coachService = new CoachService();

    /**
     * Create a new coach (admin only)
     */
    server.post('/admin/coaches', {
      schema: {
        description: 'Create a new coach (admin only)',
        tags: ['Coaches'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['trainId', 'coachTypeId', 'coachNumber', 'totalSeats'],
          properties: {
            trainId: { type: 'string' },
            coachTypeId: { type: 'string' },
            coachNumber: { type: 'string', minLength: 1, maxLength: 10 },
            totalSeats: { type: 'number', minimum: 1, maximum: 200 },
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
                  coach: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      trainId: { type: 'string' },
                      coachTypeId: { type: 'string' },
                      coachNumber: { type: 'string' },
                      totalSeats: { type: 'number' },
                      isActive: { type: 'boolean' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                      coachType: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          code: { type: 'string' },
                          description: { type: 'string' },
                          ratePerKm: { type: 'number' },
                        },
                      },
                      train: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          number: { type: 'string' },
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
              message: 'Only administrators can create coaches',
            },
            timestamp: new Date().toISOString(),
          });
        }

        // Validate request body
        const validation = createCoachSchema.safeParse(request.body);
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

        const coachData: CreateCoachData = validation.data;

        // Create coach
        const coach = await coachService.createCoach(coachData);

        appLogger.info('Coach created successfully', {
          coachId: coach.id,
          coachNumber: coach.coachNumber,
          trainId: coach.trainId,
          coachTypeId: coach.coachTypeId,
          createdBy: user.userId,
        });

        return reply.status(HTTP_STATUS.CREATED).send({
          success: true,
          message: 'Coach created successfully',
          data: { coach },
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Coach creation failed', { error });

        return reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: {
            code: (error as { code?: string }).code || 'COACH_CREATION_ERROR',
            message: (error as { message?: string }).message || 'Coach creation failed',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Get coaches by train ID
     */
    server.get('/trains/:trainId/coaches', {
      schema: {
        description: 'Get all coaches for a specific train',
        tags: ['Coaches'],
        params: {
          type: 'object',
          required: ['trainId'],
          properties: {
            trainId: { type: 'string' },
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
                    trainId: { type: 'string' },
                    coachTypeId: { type: 'string' },
                    coachNumber: { type: 'string' },
                    totalSeats: { type: 'number' },
                    isActive: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    coachType: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        code: { type: 'string' },
                        description: { type: 'string' },
                        ratePerKm: { type: 'number' },
                      },
                    },
                    train: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        number: { type: 'string' },
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
        const { trainId } = request.params as { trainId: string };

        const coaches = await coachService.getCoachesByTrain(trainId);

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          data: coaches,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Failed to get coaches by train', { error });

        return reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: {
            code: 'GET_COACHES_ERROR',
            message: 'Failed to get coaches',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Get coach by ID
     */
    server.get('/coaches/:id', {
      schema: {
        description: 'Get a coach by ID',
        tags: ['Coaches'],
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
              data: {
                type: 'object',
                properties: {
                  coach: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      trainId: { type: 'string' },
                      coachTypeId: { type: 'string' },
                      coachNumber: { type: 'string' },
                      totalSeats: { type: 'number' },
                      isActive: { type: 'boolean' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                      coachType: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          code: { type: 'string' },
                          description: { type: 'string' },
                          ratePerKm: { type: 'number' },
                        },
                      },
                      train: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          number: { type: 'string' },
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

        const coach = await coachService.getCoachById(id);

        if (!coach) {
          return reply.status(HTTP_STATUS.NOT_FOUND).send({
            success: false,
            error: {
              code: 'COACH_NOT_FOUND',
              message: 'Coach not found',
            },
            timestamp: new Date().toISOString(),
          });
        }

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          data: { coach },
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Failed to get coach by ID', { error });

        return reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: {
            code: 'GET_COACH_ERROR',
            message: 'Failed to get coach',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Update coach (admin only)
     */
    server.put('/admin/coaches/:id', {
      schema: {
        description: 'Update a coach (admin only)',
        tags: ['Coaches'],
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
            coachTypeId: { type: 'string' },
            coachNumber: { type: 'string', minLength: 1, maxLength: 10 },
            totalSeats: { type: 'number', minimum: 1, maximum: 200 },
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
                  coach: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      trainId: { type: 'string' },
                      coachTypeId: { type: 'string' },
                      coachNumber: { type: 'string' },
                      totalSeats: { type: 'number' },
                      isActive: { type: 'boolean' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                      coachType: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          code: { type: 'string' },
                          description: { type: 'string' },
                          ratePerKm: { type: 'number' },
                        },
                      },
                      train: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          number: { type: 'string' },
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
              message: 'Only administrators can update coaches',
            },
            timestamp: new Date().toISOString(),
          });
        }

        const { id } = request.params as { id: string };

        // Validate request body
        const validation = updateCoachSchema.safeParse(request.body);
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

        // Update coach
        const coach = await coachService.updateCoach(id, updateData);

        appLogger.info('Coach updated successfully', {
          coachId: coach.id,
          updatedBy: user.userId,
        });

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          message: 'Coach updated successfully',
          data: { coach },
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Coach update failed', { error });

        if ((error as { message?: string }).message?.includes('not found')) {
          return reply.status(HTTP_STATUS.NOT_FOUND).send({
            success: false,
            error: {
              code: 'COACH_NOT_FOUND',
              message: 'Coach not found',
            },
            timestamp: new Date().toISOString(),
          });
        }

        return reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: {
            code: 'COACH_UPDATE_ERROR',
            message: (error as { message?: string }).message || 'Coach update failed',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Delete coach (admin only)
     */
    server.delete('/admin/coaches/:id', {
      schema: {
        description: 'Delete a coach (admin only)',
        tags: ['Coaches'],
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
              message: 'Only administrators can delete coaches',
            },
            timestamp: new Date().toISOString(),
          });
        }

        const { id } = request.params as { id: string };

        // Delete coach
        await coachService.deleteCoach(id);

        appLogger.info('Coach deleted successfully', {
          coachId: id,
          deletedBy: user.userId,
        });

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          message: 'Coach deleted successfully',
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Coach deletion failed', { error });

        if ((error as { message?: string }).message?.includes('not found')) {
          return reply.status(HTTP_STATUS.NOT_FOUND).send({
            success: false,
            error: {
              code: 'COACH_NOT_FOUND',
              message: 'Coach not found',
            },
            timestamp: new Date().toISOString(),
          });
        }

        return reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: {
            code: 'COACH_DELETION_ERROR',
            message: 'Coach deletion failed',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Get all coaches (admin only)
     */
    server.get('/admin/coaches', {
      schema: {
        description: 'Get all coaches (admin only)',
        tags: ['Coaches'],
        security: [{ bearerAuth: [] }],
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
                    trainId: { type: 'string' },
                    coachTypeId: { type: 'string' },
                    coachNumber: { type: 'string' },
                    totalSeats: { type: 'number' },
                    isActive: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    coachType: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        code: { type: 'string' },
                        description: { type: 'string' },
                        ratePerKm: { type: 'number' },
                      },
                    },
                    train: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        number: { type: 'string' },
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
              message: 'Only administrators can view all coaches',
            },
            timestamp: new Date().toISOString(),
          });
        }

        const coaches = await coachService.getAllCoaches();

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          data: coaches,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Failed to get all coaches', { error });

        return reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: {
            code: 'GET_ALL_COACHES_ERROR',
            message: 'Failed to get all coaches',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });
  };
};