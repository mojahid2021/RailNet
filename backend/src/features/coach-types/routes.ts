/**
 * Coach Type routes for RailNet Backend
 * Handles coach type management operations (admin only)
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { appLogger } from '../../core/logger';
import { HTTP_STATUS } from '../../shared/constants';
import { CoachTypeService, CreateCoachTypeData } from './service';

// Validation schemas
const createCoachTypeSchema = z.object({
  name: z.string().min(1, 'Coach type name is required').max(100, 'Coach type name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  totalSeats: z.number().int().min(1, 'Total seats must be at least 1').max(200, 'Total seats too high'),
  ratePerKm: z.number().min(0, 'Rate per km must be positive').max(100, 'Rate per km too high'),
});

const updateCoachTypeSchema = z.object({
  name: z.string().min(1, 'Coach type name is required').max(100, 'Coach type name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  totalSeats: z.number().int().min(1, 'Total seats must be at least 1').max(200, 'Total seats too high').optional(),
  ratePerKm: z.number().min(0, 'Rate per km must be positive').max(100, 'Rate per km too high').optional(),
});

/**
 * Coach Type routes (admin only)
 */
export const createCoachTypeRoutes = (): FastifyPluginAsync => {
  return async (server) => {
    // Initialize coach type service
    const coachTypeService = new CoachTypeService();

    /**
     * Create a new coach type (admin only)
     */
    server.post('/admin', {
      schema: {
        description: 'Create a new coach type (admin only)',
        tags: ['Coach Types'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name', 'totalSeats', 'ratePerKm'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            description: { type: 'string', maxLength: 500 },
            totalSeats: { type: 'number', minimum: 1, maximum: 200 },
            ratePerKm: { type: 'number', minimum: 0, maximum: 100 },
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
                  coachType: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      code: { type: 'string' },
                      description: { type: 'string' },
                      totalSeats: { type: 'number' },
                      ratePerKm: { type: 'number' },
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
              message: 'Only administrators can create coach types',
            },
            timestamp: new Date().toISOString(),
          });
        }

        // Validate request body
        const validation = createCoachTypeSchema.safeParse(request.body);
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

        const coachTypeData: CreateCoachTypeData = validation.data;

        // Create coach type
        const coachType = await coachTypeService.createCoachType(coachTypeData);

        appLogger.info('Coach type created successfully', {
          coachTypeId: coachType.id,
          coachTypeName: coachType.name,
          coachTypeCode: coachType.code,
          createdBy: user.userId,
        });

        return reply.status(HTTP_STATUS.CREATED).send({
          success: true,
          message: 'Coach type created successfully',
          data: { coachType },
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Coach type creation failed', { error });

        return reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: {
            code: (error as { code?: string }).code || 'COACH_TYPE_CREATION_ERROR',
            message: (error as { message?: string }).message || 'Coach type creation failed',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Get all coach types
     */
    server.get('/', {
      schema: {
        description: 'Get all active coach types',
        tags: ['Coach Types'],
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
                    description: { type: 'string' },
                    ratePerKm: { type: 'number' },
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
        const coachTypes = await coachTypeService.getAllCoachTypes();

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          data: coachTypes,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Failed to get coach types', { error });

        return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
          success: false,
          error: {
            code: 'COACH_TYPES_FETCH_ERROR',
            message: 'Failed to retrieve coach types',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Get coach type by ID
     */
    server.get('/:id', {
      schema: {
        description: 'Get coach type by ID',
        tags: ['Coach Types'],
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
                  description: { type: 'string' },
                  ratePerKm: { type: 'number' },
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
        const coachType = await coachTypeService.getCoachTypeById(id);

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          data: coachType,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Failed to get coach type by ID', { error, coachTypeId: (request.params as { id: string }).id });

        const statusCode = (error as { name?: string }).name === 'NotFoundError' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;

        return reply.status(statusCode).send({
          success: false,
          error: {
            code: (error as { name?: string }).name === 'NotFoundError' ? 'COACH_TYPE_NOT_FOUND' : 'COACH_TYPE_FETCH_ERROR',
            message: (error as { message?: string }).message || 'Failed to retrieve coach type',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Search coach types
     */
    server.get('/search/:query', {
      schema: {
        description: 'Search coach types by name, code, or description',
        tags: ['Coach Types'],
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
                    description: { type: 'string' },
                    ratePerKm: { type: 'number' },
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
        const coachTypes = await coachTypeService.searchCoachTypes(query);

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          data: coachTypes,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Failed to search coach types', { error, query: (request.params as { query: string }).query });

        return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
          success: false,
          error: {
            code: 'COACH_TYPES_SEARCH_ERROR',
            message: 'Failed to search coach types',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Update coach type (admin only)
     */
    server.put('/admin/:id', {
      schema: {
        description: 'Update coach type information (admin only)',
        tags: ['Coach Types'],
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
            description: { type: 'string', maxLength: 500 },
            ratePerKm: { type: 'number', minimum: 0, maximum: 100 },
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
                  coachType: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      code: { type: 'string' },
                      description: { type: 'string' },
                      ratePerKm: { type: 'number' },
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
              message: 'Only administrators can update coach types',
            },
            timestamp: new Date().toISOString(),
          });
        }

        const { id } = request.params as { id: string };

        // Validate request body
        const validation = updateCoachTypeSchema.safeParse(request.body);
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

        // Update coach type
        const coachType = await coachTypeService.updateCoachType(id, validation.data);

        appLogger.info('Coach type updated successfully', {
          coachTypeId: coachType.id,
          coachTypeName: coachType.name,
          updatedBy: user.userId,
        });

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          message: 'Coach type updated successfully',
          data: { coachType },
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Coach type update failed', { error, coachTypeId: (request.params as { id: string }).id });

        const statusCode = (error as { name?: string }).name === 'NotFoundError' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;

        return reply.status(statusCode).send({
          success: false,
          error: {
            code: (error as { name?: string }).name === 'NotFoundError' ? 'COACH_TYPE_NOT_FOUND' : 'COACH_TYPE_UPDATE_ERROR',
            message: (error as { message?: string }).message || 'Coach type update failed',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Deactivate coach type (admin only)
     */
    server.delete('/admin/:id', {
      schema: {
        description: 'Deactivate a coach type (admin only)',
        tags: ['Coach Types'],
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
              message: 'Only administrators can deactivate coach types',
            },
            timestamp: new Date().toISOString(),
          });
        }

        const { id } = request.params as { id: string };

        // Deactivate coach type
        await coachTypeService.deactivateCoachType(id);

        appLogger.info('Coach type deactivated successfully', {
          coachTypeId: id,
          deactivatedBy: user.userId,
        });

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          message: 'Coach type deactivated successfully',
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Coach type deactivation failed', { error, coachTypeId: (request.params as { id: string }).id });

        const statusCode = (error as { name?: string }).name === 'NotFoundError' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;

        return reply.status(statusCode).send({
          success: false,
          error: {
            code: (error as { name?: string }).name === 'NotFoundError' ? 'COACH_TYPE_NOT_FOUND' : 'COACH_TYPE_DEACTIVATION_ERROR',
            message: (error as { message?: string }).message || 'Coach type deactivation failed',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Initialize default coach types (admin only)
     */
    server.post('/admin/initialize', {
      schema: {
        description: 'Initialize default coach types (admin only)',
        tags: ['Coach Types'],
        security: [{ bearerAuth: [] }],
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
              message: 'Only administrators can initialize coach types',
            },
            timestamp: new Date().toISOString(),
          });
        }

        // Initialize default coach types
        await coachTypeService.initializeDefaultCoachTypes();

        appLogger.info('Default coach types initialized successfully', {
          initializedBy: user.userId,
        });

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          message: 'Default coach types initialized successfully',
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Coach type initialization failed', { error });

        return reply.status(HTTP_STATUS.BAD_REQUEST).send({
          success: false,
          error: {
            code: 'COACH_TYPE_INITIALIZATION_ERROR',
            message: (error as { message?: string }).message || 'Coach type initialization failed',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    appLogger.debug('Coach type routes registered', {
      routes: [
        'POST /admin/coach-types',
        'GET /coach-types',
        'GET /coach-types/:id',
        'GET /coach-types/search/:query',
        'PUT /admin/coach-types/:id',
        'DELETE /admin/coach-types/:id',
        'POST /admin/coach-types/initialize'
      ],
    });
  };
};