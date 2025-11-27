/**
 * Station Controller
 * 
 * Handles station management endpoints (Admin only)
 */

import { FastifyInstance } from 'fastify'
import { stationService } from '../services'
import { CreateStationSchema, UpdateStationSchema } from '../dtos'
import { ResponseHandler, ErrorHandlerUtil, authenticateAdmin } from '../../../lib'

export async function stationRoutes(app: FastifyInstance) {
  // Create station
  app.post('/', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Create a new station',
      tags: ['stations'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'city', 'district', 'division', 'latitude', 'longitude'],
        properties: {
          name: { type: 'string' },
          city: { type: 'string' },
          district: { type: 'string' },
          division: { type: 'string' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
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
                city: { type: 'string' },
                district: { type: 'string' },
                division: { type: 'string' },
                latitude: { type: 'number' },
                longitude: { type: 'number' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const data = CreateStationSchema.parse(request.body)
      const station = await stationService.create(data)
      return ResponseHandler.created(reply, station, 'Station created successfully')
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error)
    }
  })

  // Get all stations
  app.get('/', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Get all stations',
      tags: ['stations'],
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
                  city: { type: 'string' },
                  district: { type: 'string' },
                  division: { type: 'string' },
                  latitude: { type: 'number' },
                  longitude: { type: 'number' },
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
      const stations = await stationService.findAll()
      return ResponseHandler.success(reply, stations)
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error)
    }
  })

  // Get station by ID
  app.get('/:id', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Get station by ID',
      tags: ['stations'],
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
                city: { type: 'string' },
                district: { type: 'string' },
                division: { type: 'string' },
                latitude: { type: 'number' },
                longitude: { type: 'number' },
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
      const station = await stationService.findById(id)
      return ResponseHandler.success(reply, station)
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error)
    }
  })

  // Update station
  app.put('/:id', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Update station',
      tags: ['stations'],
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
          city: { type: 'string' },
          district: { type: 'string' },
          division: { type: 'string' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
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
                city: { type: 'string' },
                district: { type: 'string' },
                division: { type: 'string' },
                latitude: { type: 'number' },
                longitude: { type: 'number' },
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
      const data = UpdateStationSchema.parse(request.body)
      const station = await stationService.update(id, data)
      return ResponseHandler.success(reply, station, 'Station updated successfully')
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error)
    }
  })

  // Delete station
  app.delete('/:id', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Delete station',
      tags: ['stations'],
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
      await stationService.delete(id)
      return ResponseHandler.success(reply, null, 'Station deleted successfully')
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error)
    }
  })
}
