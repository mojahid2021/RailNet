/**
 * Train Controller
 * 
 * Handles train management endpoints (Admin only)
 */

import { FastifyInstance } from 'fastify'
import { trainService } from '../services'
import { CreateTrainSchema, UpdateTrainSchema } from '../dtos'
import { ResponseHandler, ErrorHandlerUtil } from '../../../shared/utils'
import { authenticateAdmin, authenticateUser } from '../../../shared/middleware'

export async function trainRoutes(app: FastifyInstance) {
  // Create train
  app.post('/', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Create a new train',
      tags: ['trains'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'number', 'type'],
        properties: {
          name: { type: 'string' },
          number: { type: 'string' },
          type: { type: 'string' },
          trainRouteId: { type: 'string' },
          compartmentIds: {
            type: 'array',
            items: { type: 'string' },
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
                name: { type: 'string' },
                number: { type: 'string' },
                type: { type: 'string' },
                trainRouteId: { type: 'string' },
                compartments: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      type: { type: 'string' },
                      price: { type: 'number' },
                      totalSeat: { type: 'integer' },
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
      const data = CreateTrainSchema.parse(request.body)
      const train = await trainService.create(data)
      return ResponseHandler.created(reply, train, 'Train created successfully')
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error)
    }
  })

  // Get all trains
  app.get('/', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Get all trains',
      tags: ['trains'],
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
                  name: { type: 'string' },
                  number: { type: 'string' },
                  type: { type: 'string' },
                  trainRouteId: { type: 'string' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const trains = await trainService.findAll()
      return ResponseHandler.success(reply, trains)
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error)
    }
  })

  // Get train by ID
  app.get('/:id', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Get train by ID',
      tags: ['trains'],
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
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                number: { type: 'string' },
                type: { type: 'string' },
                trainRouteId: { type: 'string' },
                trainRoute: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                  },
                },
                compartments: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      type: { type: 'string' },
                      price: { type: 'number' },
                      totalSeat: { type: 'integer' },
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
      const train = await trainService.findById(id)
      return ResponseHandler.success(reply, train)
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error)
    }
  })

  // Update train
  app.put('/:id', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Update train',
      tags: ['trains'],
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
          name: { type: 'string' },
          number: { type: 'string' },
          type: { type: 'string' },
          trainRouteId: { type: 'string' },
          compartmentIds: {
            type: 'array',
            items: { type: 'string' },
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
                id: { type: 'string' },
                name: { type: 'string' },
                number: { type: 'string' },
                type: { type: 'string' },
                trainRouteId: { type: 'string' },
                compartments: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      type: { type: 'string' },
                      price: { type: 'number' },
                      totalSeat: { type: 'integer' },
                    },
                  },
                },
                updatedAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const data = UpdateTrainSchema.parse(request.body)
      const train = await trainService.update(id, data)
      return ResponseHandler.success(reply, train, 'Train updated successfully')
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error)
    }
  })

  // Delete train
  app.delete('/:id', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Delete train',
      tags: ['trains'],
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
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await trainService.delete(id)
      return ResponseHandler.success(reply, null, 'Train deleted successfully')
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error)
    }
  })

  // Get trains for purchase ticket (User authentication required)
  app.get('/search', {
    preHandler: authenticateUser,
    schema: {
      description: 'Get trains available for purchase between two stations on a specific date',
      tags: ['trains'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['from_station_id', 'to_station_id', 'date'],
        properties: {
          from_station_id: { type: 'string' },
          to_station_id: { type: 'string' },
          date: { type: 'string', format: 'date' },
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
                  scheduleId: { type: 'string' },
                  departureTime: { type: 'string' },
                  compartments: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        type: { type: 'string' },
                        price: { type: 'number' },
                        totalSeat: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
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
      const { from_station_id, to_station_id, date } = request.query as { from_station_id: string, to_station_id: string, date: string }
      const result = await trainService.searchForPurchase(from_station_id, to_station_id, date)
      
      if (!result.valid) {
        return ResponseHandler.error(reply, result.message || 'No valid train routes found', 400)
      }
      
      return ResponseHandler.success(reply, result.trains)
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error)
    }
  })

  // Check compartment seat booking status (User authentication required)
  app.get('/seat-status/:scheduleId/:compartmentId', {
    preHandler: authenticateUser,
    schema: {
      description: 'Check seat booking status for a compartment on a specific date',
      tags: ['trains'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          scheduleId: { type: 'string' },
          compartmentId: { type: 'string' },
        },
        required: ['scheduleId', 'compartmentId'],
      },
      querystring: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date' },
        },
        required: ['date'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                scheduleId: { type: 'string' },
                compartmentId: { type: 'string' },
                date: { type: 'string' },
                totalSeats: { type: 'integer' },
                bookedSeats: { type: 'integer' },
                availableSeats: { type: 'integer' },
                seats: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      seatNumber: { type: 'string' },
                      status: { type: 'string', enum: ['available', 'booked'] },
                      bookingId: { type: 'string' },
                    },
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
      const { scheduleId, compartmentId } = request.params as { scheduleId: string, compartmentId: string }
      const { date } = request.query as { date: string }
      const result = await trainService.getSeatStatus(scheduleId, compartmentId, date)
      return ResponseHandler.success(reply, result)
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error)
    }
  })
}
