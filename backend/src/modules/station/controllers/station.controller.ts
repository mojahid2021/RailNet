/**
 * Station Controller
 * 
 * Handles station management endpoints
 */

import { FastifyInstance } from 'fastify';
import { stationService } from '../services/station.service';
import { CreateStationSchema, UpdateStationSchema } from '../dtos';
import { ResponseHandler, ErrorHandlerUtil } from '../../../shared/utils';
import { authenticateAdmin } from '../../../shared/middleware/auth.middleware';

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
    },
  }, async (request, reply) => {
    try {
      const data = CreateStationSchema.parse(request.body);
      const station = await stationService.create(data);
      return ResponseHandler.created(reply, station, 'Station created successfully');
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error);
    }
  });

  // Get all stations
  app.get('/', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Get all stations',
      tags: ['stations'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    try {
      const stations = await stationService.findAll();
      return ResponseHandler.success(reply, stations);
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error);
    }
  });

  // Get station by ID
  app.get('/:id', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Get station by ID',
      tags: ['stations'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const station = await stationService.findById(id);
      return ResponseHandler.success(reply, station);
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error);
    }
  });

  // Update station
  app.put('/:id', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Update station',
      tags: ['stations'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
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
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = UpdateStationSchema.parse(request.body);
      const station = await stationService.update(id, data);
      return ResponseHandler.success(reply, station, 'Station updated successfully');
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error);
    }
  });

  // Delete station
  app.delete('/:id', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Delete station',
      tags: ['stations'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      await stationService.delete(id);
      return ResponseHandler.noContent(reply);
    } catch (error) {
      return ErrorHandlerUtil.handle(reply, error);
    }
  });
}
