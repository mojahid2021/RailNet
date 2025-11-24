import { FastifyInstance } from 'fastify'
import { createStationSchema, CreateStationInput, updateStationSchema, UpdateStationInput } from '../schemas/admin'
import { ResponseHandler } from '../utils/response'
import { ConflictError, NotFoundError } from '../errors'
import { authenticateAdmin } from '../middleware/auth'

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
      const stationData: CreateStationInput = createStationSchema.parse(request.body)

      const station = await (app as any).prisma.station.create({
        data: stationData,
        select: {
          id: true,
          name: true,
          city: true,
          district: true,
          division: true,
          latitude: true,
          longitude: true,
          createdAt: true,
        },
      })

      return ResponseHandler.created(reply, station, 'Station created successfully')
    } catch (error) {
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
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
      const stations = await (app as any).prisma.station.findMany({
        orderBy: { createdAt: 'desc' },
      })

      return ResponseHandler.success(reply, stations)
    } catch (error) {
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
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

      const station = await (app as any).prisma.station.findUnique({
        where: { id },
      })

      if (!station) {
        throw new NotFoundError('Station not found')
      }

      return ResponseHandler.success(reply, station)
    } catch (error) {
      if (error instanceof NotFoundError) {
        return ResponseHandler.error(reply, error.message, 404)
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
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
      const updateData: UpdateStationInput = updateStationSchema.parse(request.body)

      const station = await (app as any).prisma.station.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          city: true,
          district: true,
          division: true,
          latitude: true,
          longitude: true,
          updatedAt: true,
        },
      })

      return ResponseHandler.success(reply, station, 'Station updated successfully')
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return ResponseHandler.error(reply, 'Station not found', 404)
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
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

      await (app as any).prisma.station.delete({
        where: { id },
      })

      return ResponseHandler.success(reply, null, 'Station deleted successfully')
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        return ResponseHandler.error(reply, 'Station not found', 404)
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
    }
  })
}