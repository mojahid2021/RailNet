/**
 * Train Route Controller
 * 
 * Handles train route management endpoints (Admin only)
 */

import { FastifyInstance } from 'fastify'
import { trainRouteService } from '../services'
import { CreateTrainRouteSchema, UpdateTrainRouteSchema } from '../dtos'
import { ResponseHandler, ErrorHandlerUtil } from '../../../shared/utils'
import { authenticateAdmin } from '../../../shared/middleware'

export async function trainRouteRoutes(app: FastifyInstance) {
  // Create train route
  app.post('/', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Create a new train route',
      tags: ['train-routes'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'totalDistance', 'startStationId', 'endStationId', 'stations'],
        properties: {
          name: { type: 'string' },
          totalDistance: { type: 'number' },
          startStationId: { type: 'string' },
          endStationId: { type: 'string' },
          stations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                currentStationId: { type: 'string' },
                beforeStationId: { type: 'string' },
                nextStationId: { type: 'string' },
                distance: { type: 'number' },
                distanceFromStart: { type: 'number' },
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
                name: { type: 'string' },
                totalDistance: { type: 'number' },
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
                stations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      currentStation: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                        },
                      },
                      beforeStationId: { type: 'string' },
                      nextStationId: { type: 'string' },
                      distance: { type: 'number' },
                      distanceFromStart: { type: 'number' },
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
      const data = CreateTrainRouteSchema.parse(request.body)
      const route = await trainRouteService.create(data)
      return ResponseHandler.created(reply, route, 'Train route created successfully')
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error)
    }
  })

  // Get all train routes
  app.get('/', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Get all train routes',
      tags: ['train-routes'],
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
                  totalDistance: { type: 'number' },
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
      const routes = await trainRouteService.findAll()
      return ResponseHandler.success(reply, routes)
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error)
    }
  })

  // Get train route by ID
  app.get('/:id', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Get train route by ID',
      tags: ['train-routes'],
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
                totalDistance: { type: 'number' },
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
                stations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      currentStation: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                        },
                      },
                      beforeStationId: { type: 'string' },
                      nextStationId: { type: 'string' },
                      distance: { type: 'number' },
                      distanceFromStart: { type: 'number' },
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
      const route = await trainRouteService.findById(id)
      return ResponseHandler.success(reply, route)
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error)
    }
  })

  // Update train route
  app.put('/:id', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Update train route',
      tags: ['train-routes'],
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
          totalDistance: { type: 'number' },
          startStationId: { type: 'string' },
          endStationId: { type: 'string' },
          stations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                currentStationId: { type: 'string' },
                beforeStationId: { type: 'string' },
                nextStationId: { type: 'string' },
                distance: { type: 'number' },
                distanceFromStart: { type: 'number' },
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
                id: { type: 'string' },
                name: { type: 'string' },
                totalDistance: { type: 'number' },
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
                stations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      currentStation: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                        },
                      },
                      beforeStationId: { type: 'string' },
                      nextStationId: { type: 'string' },
                      distance: { type: 'number' },
                      distanceFromStart: { type: 'number' },
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
      const data = UpdateTrainRouteSchema.parse(request.body)
      const route = await trainRouteService.update(id, data)
      return ResponseHandler.success(reply, route, 'Train route updated successfully')
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error)
    }
  })

  // Delete train route
  app.delete('/:id', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Delete train route',
      tags: ['train-routes'],
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
      await trainRouteService.delete(id)
      return ResponseHandler.success(reply, null, 'Train route deleted successfully')
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error)
    }
  })
}
