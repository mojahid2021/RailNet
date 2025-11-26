/**
 * Compartment Controller
 * 
 * Handles compartment management endpoints (Admin only)
 */

import { FastifyInstance } from 'fastify'
import { compartmentService } from '../services'
import { CreateCompartmentSchema, UpdateCompartmentSchema } from '../dtos'
import { ResponseHandler, ErrorHandlerUtil } from '../../../shared/utils'
import { authenticateAdmin } from '../../../shared/middleware'

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
      const data = CreateCompartmentSchema.parse(request.body)
      const compartment = await compartmentService.create(data)
      return ResponseHandler.created(reply, compartment, 'Compartment created successfully')
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error)
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
      const compartments = await compartmentService.findAll()
      return ResponseHandler.success(reply, compartments)
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error)
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
      const compartment = await compartmentService.findById(id)
      return ResponseHandler.success(reply, compartment)
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error)
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
      const data = UpdateCompartmentSchema.parse(request.body)
      const compartment = await compartmentService.update(id, data)
      return ResponseHandler.success(reply, compartment, 'Compartment updated successfully')
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error)
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
      await compartmentService.delete(id)
      return ResponseHandler.success(reply, null, 'Compartment deleted successfully')
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error)
    }
  })
}
