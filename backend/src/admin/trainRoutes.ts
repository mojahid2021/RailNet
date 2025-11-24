import { FastifyInstance } from 'fastify'
import { createTrainRouteSchema, CreateTrainRouteInput, updateTrainRouteSchema, UpdateTrainRouteInput } from '../schemas/admin'
import { ResponseHandler } from '../utils/response'
import { ConflictError, NotFoundError } from '../errors'
import { authenticateAdmin } from '../middleware/auth'

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
        required: ['name', 'totalDistance', 'startStationId', 'endStationId', 'stations', 'compartmentIds'],
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
      const routeData: CreateTrainRouteInput = createTrainRouteSchema.parse(request.body)

      // Check if start and end stations exist
      const startStation = await (app as any).prisma.station.findUnique({
        where: { id: routeData.startStationId },
        select: { id: true, name: true },
      })
      if (!startStation) {
        throw new NotFoundError('Start station not found')
      }

      const endStation = await (app as any).prisma.station.findUnique({
        where: { id: routeData.endStationId },
        select: { id: true, name: true },
      })
      if (!endStation) {
        throw new NotFoundError('End station not found')
      }

      // Check if all stations in the route exist
      const stationIds = routeData.stations.map(s => s.currentStationId)
      const existingStations = await (app as any).prisma.station.findMany({
        where: { id: { in: stationIds } },
        select: { id: true, name: true },
      })
      if (existingStations.length !== stationIds.length) {
        throw new NotFoundError('One or more stations not found')
      }

      const stationMap = new Map(existingStations.map((s: { id: string; name: string }) => [s.id, s.name]))

      // Check if all compartments exist
      const existingCompartments = await (app as any).prisma.compartment.findMany({
        where: { id: { in: routeData.compartmentIds } },
        select: { id: true, name: true, type: true, price: true, totalSeat: true },
      })
      if (existingCompartments.length !== routeData.compartmentIds.length) {
        throw new NotFoundError('One or more compartments not found')
      }

      const route = await (app as any).prisma.trainRoute.create({
        data: {
          name: routeData.name,
          totalDistance: routeData.totalDistance,
          startStationId: routeData.startStationId,
          endStationId: routeData.endStationId,
          stations: {
            create: routeData.stations.map(station => ({
              currentStationId: station.currentStationId,
              beforeStationId: station.beforeStationId,
              nextStationId: station.nextStationId,
              distance: station.distance,
              distanceFromStart: station.distanceFromStart,
            })),
          },
          compartments: {
            create: routeData.compartmentIds.map(compartmentId => ({
              compartmentId,
            })),
          },
        },
        include: {
          startStation: { select: { id: true, name: true } },
          endStation: { select: { id: true, name: true } },
          stations: {
            include: {
              currentStation: { select: { id: true, name: true } },
            },
            orderBy: { distanceFromStart: 'asc' },
          },
          compartments: {
            include: {
              compartment: { select: { id: true, name: true, type: true, price: true, totalSeat: true } },
            },
          },
        },
      })

      return ResponseHandler.created(reply, route, 'Train route created successfully')
    } catch (error) {
      if (error instanceof NotFoundError) {
        return ResponseHandler.error(reply, error.message, 404)
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
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
      const routes = await (app as any).prisma.trainRoute.findMany({
        include: {
          startStation: { select: { id: true, name: true } },
          endStation: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      return ResponseHandler.success(reply, routes)
    } catch (error) {
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
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

      const route = await (app as any).prisma.trainRoute.findUnique({
        where: { id },
        include: {
          startStation: { select: { id: true, name: true } },
          endStation: { select: { id: true, name: true } },
          stations: {
            include: {
              currentStation: { select: { id: true, name: true } },
            },
            orderBy: { distanceFromStart: 'asc' },
          },
          compartments: {
            include: {
              compartment: { select: { id: true, name: true, type: true, price: true, totalSeat: true } },
            },
          },
        },
      })

      if (!route) {
        throw new NotFoundError('Train route not found')
      }

      return ResponseHandler.success(reply, route)
    } catch (error) {
      if (error instanceof NotFoundError) {
        return ResponseHandler.error(reply, error.message, 404)
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
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
      const updateData: UpdateTrainRouteInput = updateTrainRouteSchema.parse(request.body)

      const updatePayload: any = {}

      if (updateData.name) updatePayload.name = updateData.name
      if (updateData.totalDistance) updatePayload.totalDistance = updateData.totalDistance
      if (updateData.startStationId) {
        const startStation = await (app as any).prisma.station.findUnique({
          where: { id: updateData.startStationId },
          select: { id: true },
        })
        if (!startStation) {
          throw new NotFoundError('Start station not found')
        }
        updatePayload.startStationId = updateData.startStationId
      }
      if (updateData.endStationId) {
        const endStation = await (app as any).prisma.station.findUnique({
          where: { id: updateData.endStationId },
          select: { id: true },
        })
        if (!endStation) {
          throw new NotFoundError('End station not found')
        }
        updatePayload.endStationId = updateData.endStationId
      }

      if (updateData.compartmentIds) {
        // Check if all compartments exist
        const existingCompartments = await (app as any).prisma.compartment.findMany({
          where: { id: { in: updateData.compartmentIds } },
          select: { id: true },
        })
        if (existingCompartments.length !== updateData.compartmentIds.length) {
          throw new NotFoundError('One or more compartments not found')
        }

        // Delete existing compartments and create new ones
        await (app as any).prisma.trainRouteCompartment.deleteMany({
          where: { trainRouteId: id },
        })

        updatePayload.compartments = {
          create: updateData.compartmentIds.map(compartmentId => ({
            compartmentId,
          })),
        }
      }

      const route = await (app as any).prisma.trainRoute.update({
        where: { id },
        data: updatePayload,
        include: {
          startStation: { select: { id: true, name: true } },
          endStation: { select: { id: true, name: true } },
          stations: {
            include: {
              currentStation: { select: { id: true, name: true } },
            },
            orderBy: { distanceFromStart: 'asc' },
          },
          compartments: {
            include: {
              compartment: { select: { id: true, name: true, type: true, price: true, totalSeat: true } },
            },
          },
        },
      })

      return ResponseHandler.success(reply, route, 'Train route updated successfully')
    } catch (error) {
      if (error instanceof NotFoundError) {
        return ResponseHandler.error(reply, error.message, 404)
      }
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return ResponseHandler.error(reply, 'Train route not found', 404)
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
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

      await (app as any).prisma.trainRoute.delete({
        where: { id },
      })

      return ResponseHandler.success(reply, null, 'Train route deleted successfully')
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        return ResponseHandler.error(reply, 'Train route not found', 404)
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
    }
  })
}