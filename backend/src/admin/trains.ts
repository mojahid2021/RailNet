import { FastifyInstance } from 'fastify'
import { createTrainSchema, CreateTrainInput, updateTrainSchema, UpdateTrainInput } from '../schemas/admin'
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
      const trainData: CreateTrainInput = createTrainSchema.parse(request.body)

      // Check if train number already exists
      const existingTrain = await (app as any).prisma.train.findUnique({
        where: { number: trainData.number },
      })

      if (existingTrain) {
        throw new ConflictError('Train with this number already exists')
      }

      // Check if train route exists (if provided)
      if (trainData.trainRouteId) {
        const trainRoute = await (app as any).prisma.trainRoute.findUnique({
          where: { id: trainData.trainRouteId },
        })
        if (!trainRoute) {
          throw new NotFoundError('Train route not found')
        }
      }

      // Check if compartments exist (if provided)
      if (trainData.compartmentIds && trainData.compartmentIds.length > 0) {
        const existingCompartments = await (app as any).prisma.compartment.findMany({
          where: { id: { in: trainData.compartmentIds } },
        })
        if (existingCompartments.length !== trainData.compartmentIds.length) {
          throw new NotFoundError('One or more compartments not found')
        }
      }

      const train = await (app as any).prisma.train.create({
        data: {
          name: trainData.name,
          number: trainData.number,
          type: trainData.type,
          trainRouteId: trainData.trainRouteId,
          compartments: trainData.compartmentIds ? {
            create: trainData.compartmentIds.map(compartmentId => ({
              compartmentId,
            })),
          } : undefined,
        },
        include: {
          trainRoute: {
            select: { id: true, name: true },
          },
          compartments: {
            include: {
              compartment: { select: { id: true, name: true, type: true, price: true, totalSeat: true } },
            },
          },
        },
      })

      return ResponseHandler.created(reply, train, 'Train created successfully')
    } catch (error) {
      if (error instanceof ConflictError) {
        return ResponseHandler.error(reply, error.message, 409)
      }
      if (error instanceof NotFoundError) {
        return ResponseHandler.error(reply, error.message, 404)
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
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
      const trains = await (app as any).prisma.train.findMany({
        include: {
          trainRoute: {
            select: { id: true, name: true },
          },
          compartments: {
            include: {
              compartment: { select: { id: true, name: true, type: true, price: true, totalSeat: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return ResponseHandler.success(reply, trains)
    } catch (error) {
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
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

      const train = await (app as any).prisma.train.findUnique({
        where: { id },
        include: {
          trainRoute: {
            select: { id: true, name: true },
          },
          compartments: {
            include: {
              compartment: { select: { id: true, name: true, type: true, price: true, totalSeat: true } },
            },
          },
        },
      })

      if (!train) {
        throw new NotFoundError('Train not found')
      }

      return ResponseHandler.success(reply, train)
    } catch (error) {
      if (error instanceof NotFoundError) {
        return ResponseHandler.error(reply, error.message, 404)
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
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
      const updateData: UpdateTrainInput = updateTrainSchema.parse(request.body)

      // Check if number is being updated and if it conflicts
      if (updateData.number) {
        const existingTrain = await (app as any).prisma.train.findFirst({
          where: {
            number: updateData.number,
            id: { not: id },
          },
        })

        if (existingTrain) {
          throw new ConflictError('Train with this number already exists')
        }
      }

      // Check if train route exists (if provided)
      if (updateData.trainRouteId) {
        const trainRoute = await (app as any).prisma.trainRoute.findUnique({
          where: { id: updateData.trainRouteId },
        })
        if (!trainRoute) {
          throw new NotFoundError('Train route not found')
        }
      }

      // Check if compartments exist (if provided)
      if (updateData.compartmentIds) {
        const existingCompartments = await (app as any).prisma.compartment.findMany({
          where: { id: { in: updateData.compartmentIds } },
        })
        if (existingCompartments.length !== updateData.compartmentIds.length) {
          throw new NotFoundError('One or more compartments not found')
        }

        // Delete existing compartments and create new ones
        await (app as any).prisma.trainCompartment.deleteMany({
          where: { trainId: id },
        })
      }

      const updatePayload: any = {}
      if (updateData.name) updatePayload.name = updateData.name
      if (updateData.number) updatePayload.number = updateData.number
      if (updateData.type) updatePayload.type = updateData.type
      if (updateData.trainRouteId !== undefined) updatePayload.trainRouteId = updateData.trainRouteId

      if (updateData.compartmentIds) {
        updatePayload.compartments = {
          create: updateData.compartmentIds.map(compartmentId => ({
            compartmentId,
          })),
        }
      }

      const train = await (app as any).prisma.train.update({
        where: { id },
        data: updatePayload,
        include: {
          trainRoute: {
            select: { id: true, name: true },
          },
          compartments: {
            include: {
              compartment: { select: { id: true, name: true, type: true, price: true, totalSeat: true } },
            },
          },
        },
      })

      return ResponseHandler.success(reply, train, 'Train updated successfully')
    } catch (error) {
      if (error instanceof ConflictError) {
        return ResponseHandler.error(reply, error.message, 409)
      }
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return ResponseHandler.error(reply, 'Train not found', 404)
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
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

      await (app as any).prisma.train.delete({
        where: { id },
      })

      return ResponseHandler.success(reply, null, 'Train deleted successfully')
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        return ResponseHandler.error(reply, 'Train not found', 404)
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
    }
  })
}