import { FastifyInstance } from 'fastify'
import { createCompartmentSchema, CreateCompartmentInput, updateCompartmentSchema, UpdateCompartmentInput } from '../schemas/admin'
import { ResponseHandler } from '../utils/response'
import { ConflictError, NotFoundError } from '../errors'
import { authenticateAdmin } from '../middleware/auth'

export async function compartmentRoutes(app: FastifyInstance) {
  // Create compartment
  app.post('/', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Create a new compartment',
      tags: ['compartments'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'type', 'price', 'totalSeat'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          price: { type: 'number' },
          totalSeat: { type: 'integer' },
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
                type: { type: 'string' },
                price: { type: 'number' },
                totalSeat: { type: 'integer' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const compartmentData: CreateCompartmentInput = createCompartmentSchema.parse(request.body)

      const compartment = await (app as any).prisma.compartment.create({
        data: compartmentData,
        select: {
          id: true,
          name: true,
          type: true,
          price: true,
          totalSeat: true,
          createdAt: true,
        },
      })

      return ResponseHandler.created(reply, compartment, 'Compartment created successfully')
    } catch (error) {
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
    }
  })

  // Get all compartments
  app.get('/', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Get all compartments',
      tags: ['compartments'],
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
                  type: { type: 'string' },
                  price: { type: 'number' },
                  totalSeat: { type: 'integer' },
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
      const compartments = await (app as any).prisma.compartment.findMany({
        orderBy: { createdAt: 'desc' },
      })

      return ResponseHandler.success(reply, compartments)
    } catch (error) {
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
    }
  })

  // Get compartment by ID
  app.get('/:id', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Get compartment by ID',
      tags: ['compartments'],
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
                type: { type: 'string' },
                price: { type: 'number' },
                totalSeat: { type: 'integer' },
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

      const compartment = await (app as any).prisma.compartment.findUnique({
        where: { id },
      })

      if (!compartment) {
        throw new NotFoundError('Compartment not found')
      }

      return ResponseHandler.success(reply, compartment)
    } catch (error) {
      if (error instanceof NotFoundError) {
        return ResponseHandler.error(reply, error.message, 404)
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
    }
  })

  // Update compartment
  app.put('/:id', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Update compartment',
      tags: ['compartments'],
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
          type: { type: 'string' },
          price: { type: 'number' },
          totalSeat: { type: 'integer' },
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
                type: { type: 'string' },
                price: { type: 'number' },
                totalSeat: { type: 'integer' },
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
      const updateData: UpdateCompartmentInput = updateCompartmentSchema.parse(request.body)

      const compartment = await (app as any).prisma.compartment.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          type: true,
          price: true,
          totalSeat: true,
          updatedAt: true,
        },
      })

      return ResponseHandler.success(reply, compartment, 'Compartment updated successfully')
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return ResponseHandler.error(reply, 'Compartment not found', 404)
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
    }
  })

  // Delete compartment
  app.delete('/:id', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Delete compartment',
      tags: ['compartments'],
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

      await (app as any).prisma.compartment.delete({
        where: { id },
      })

      return ResponseHandler.success(reply, null, 'Compartment deleted successfully')
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        return ResponseHandler.error(reply, 'Compartment not found', 404)
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
    }
  })
}