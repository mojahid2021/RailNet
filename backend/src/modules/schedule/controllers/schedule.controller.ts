/**
 * Schedule Controller
 * 
 * Handles schedule management endpoints
 */

import { FastifyInstance } from 'fastify'
import { scheduleService } from '../services'
import { CreateScheduleSchema, ScheduleQuerySchema } from '../dtos'
import { ResponseHandler, ErrorHandlerUtil, AdminSecurity, authenticateAdmin, authenticateUser } from '../../../lib'

/**
 * Schedule Management Routes - ADMIN ONLY
 *
 * All schedule operations require admin authentication and authorization.
 * These routes are protected by JWT authentication with admin token validation.
 *
 * Security Features:
 * - JWT Bearer token authentication required
 * - Admin token type validation
 * - Admin ID tracking for audit trails
 * - Comprehensive logging of admin actions
 */

export async function scheduleRoutes(app: FastifyInstance) {
  // Create schedule
  app.post('/', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Create a new train schedule with station-by-station timing',
      tags: ['schedules'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['trainId', 'departureTime', 'stationSchedules'],
        properties: {
          trainId: { type: 'string', format: 'uuid' },
          departureTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$', description: 'Departure time in HH:MM format (24-hour)' },
          stationSchedules: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['stationId', 'estimatedArrival', 'estimatedDeparture'],
              properties: {
                stationId: { type: 'string', format: 'uuid' },
                estimatedArrival: { type: 'string', format: 'date-time' },
                estimatedDeparture: { type: 'string', format: 'date-time' },
                platformNumber: { type: 'string' },
                remarks: { type: 'string' },
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
                id: { type: 'string' },
                trainId: { type: 'string' },
                routeId: { type: 'string' },
                departureTime: { type: 'string' },
                status: { type: 'string' },
                train: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    number: { type: 'string' },
                    type: { type: 'string' },
                  },
                },
                route: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    startStation: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                      },
                    },
                    endStation: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                      },
                    },
                  },
                },
                stationSchedules: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      stationId: { type: 'string' },
                      sequenceOrder: { type: 'integer' },
                      estimatedArrival: { type: 'string' },
                      estimatedDeparture: { type: 'string' },
                      durationFromPrevious: { type: 'integer' },
                      waitingTime: { type: 'integer' },
                      status: { type: 'string' },
                      platformNumber: { type: 'string' },
                      remarks: { type: 'string' },
                      station: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          city: { type: 'string' },
                          district: { type: 'string' },
                        },
                      },
                    },
                  },
                },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      // Validate admin access and log operation
      const adminInfo = AdminSecurity.validateAdminAccess(request, 'create_schedule')

      // Check specific permissions
      if (!AdminSecurity.checkPermission(adminInfo.adminId, 'create_schedule')) {
        return ResponseHandler.error(reply, 'Insufficient permissions to create schedules', 403)
      }

      const data = CreateScheduleSchema.parse(request.body)
      const schedule = await scheduleService.create(data, adminInfo.adminId)

      // Log successful operation
      AdminSecurity.logAdminAction(adminInfo.adminId, 'schedule_created', {
        scheduleId: schedule?.id,
        trainId: data.trainId,
        stationCount: data.stationSchedules.length,
      })

      return ResponseHandler.created(reply, schedule, 'Schedule created successfully')
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error)
    }
  })

  // Get all schedules with optional filters
  app.get('/', {
    preHandler: authenticateUser,
    schema: {
      description: 'Get all train schedules with optional filters',
      tags: ['schedules'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          trainId: { type: 'string', format: 'uuid' },
          departureTime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$', description: 'Departure time in HH:MM format' },
          status: { type: 'string', enum: ['scheduled', 'running', 'completed', 'delayed', 'cancelled'] },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'integer', minimum: 0, default: 0 },
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
                schedules: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      trainId: { type: 'string' },
                      routeId: { type: 'string' },
                      departureTime: { type: 'string' },
                      status: { type: 'string' },
                      train: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          number: { type: 'string' },
                          type: { type: 'string' },
                        },
                      },
                      route: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          startStation: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                            },
                          },
                          endStation: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                            },
                          },
                        },
                      },
                      _count: {
                        type: 'object',
                        properties: {
                          stationSchedules: { type: 'integer' },
                        },
                      },
                      createdAt: { type: 'string' },
                    },
                  },
                },
                pagination: {
                  type: 'object',
                  properties: {
                    total: { type: 'integer' },
                    limit: { type: 'integer' },
                    offset: { type: 'integer' },
                    hasMore: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const queryParams = ScheduleQuerySchema.parse(request.query)
      const result = await scheduleService.findAll(queryParams)
      return ResponseHandler.success(reply, result)
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error)
    }
  })

  // Get schedule by ID
  app.get('/:id', {
    preHandler: authenticateUser,
    schema: {
      description: 'Get schedule details by ID',
      tags: ['schedules'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
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
                trainId: { type: 'string' },
                routeId: { type: 'string' },
                departureTime: { type: 'string' },
                status: { type: 'string' },
                train: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    number: { type: 'string' },
                    type: { type: 'string' },
                  },
                },
                route: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    startStation: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                      },
                    },
                    endStation: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                      },
                    },
                  },
                },
                stationSchedules: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      stationId: { type: 'string' },
                      sequenceOrder: { type: 'integer' },
                      estimatedArrival: { type: 'string' },
                      estimatedDeparture: { type: 'string' },
                      actualArrival: { type: 'string' },
                      actualDeparture: { type: 'string' },
                      durationFromPrevious: { type: 'integer' },
                      waitingTime: { type: 'integer' },
                      status: { type: 'string' },
                      platformNumber: { type: 'string' },
                      remarks: { type: 'string' },
                      station: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          city: { type: 'string' },
                          district: { type: 'string' },
                        },
                      },
                      updates: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            previousStatus: { type: 'string' },
                            newStatus: { type: 'string' },
                            reason: { type: 'string' },
                            updatedAt: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
              },
            },
          },
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const schedule = await scheduleService.findById(id)
      return ResponseHandler.success(reply, schedule)
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error)
    }
  })
}
