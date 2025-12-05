import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { errorResponseSchema, stationWithTimestampsSchema, createStationBodySchema, stationsListResponseSchema } from '../schemas/index.js';

const prisma = new PrismaClient();

export default async function stationRoutes(fastify: FastifyInstance) {
  // Create station - Admin only
  fastify.post('/stations', {
    preHandler: (fastify as any).requireAdmin,
    schema: {
      description: 'Create a new station (Admin only)',
      tags: ['Stations'],
      security: [{ bearerAuth: [] }],
      body: createStationBodySchema,
      response: {
        201: stationWithTimestampsSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const { name, city, latitude, longitude } = request.body as { name: string; city: string; latitude: number; longitude: number };

    const station = await prisma.station.create({
      data: {
        name,
        city,
        latitude,
        longitude,
      },
    });

    reply.code(201).send(station);
  });

  // Get all stations - Authenticated users
  fastify.get('/stations', {
    preHandler: (fastify as any).authenticate,
    schema: {
      description: 'Get all stations',
      tags: ['Stations'],
      security: [{ bearerAuth: [] }],
      response: {
        200: stationsListResponseSchema,
      },
    },
  }, async (request, reply) => {
    const stations = await prisma.station.findMany({
      orderBy: { createdAt: 'desc' },
    });

    reply.send(stations);
  });

  // Get station by ID - Authenticated users
  fastify.get('/stations/:id', {
    preHandler: (fastify as any).authenticate,
    schema: {
      description: 'Get a station by ID',
      tags: ['Stations'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: stationWithTimestampsSchema,
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const stationId = parseInt(id);

    if (isNaN(stationId)) {
      return reply.code(400).send({ error: 'Invalid station ID' });
    }

    const station = await prisma.station.findUnique({
      where: { id: stationId },
    });

    if (!station) {
      return reply.code(404).send({ error: 'Station not found' });
    }

    reply.send(station);
  });
}