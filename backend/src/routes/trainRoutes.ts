import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma';
import {
  errorResponseSchema,
  trainRouteSchema,
  trainRouteWithDetailsSchema,
  createTrainRouteBodySchema,
} from '../schemas/index.js';
export default async function trainRouteRoutes(fastify: FastifyInstance) {
  // Create train route - Admin only
  fastify.post(
    '/train-routes',
    {
      preHandler: (fastify as any).requireAdmin,
      schema: {
        description: 'Create a new train route with stations',
        tags: ['Train Routes'],
        security: [{ bearerAuth: [] }],
        body: createTrainRouteBodySchema,
        response: {
          201: trainRouteSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { name, stations } = request.body as {
        name: string;
        stations: { stationId: number; distance: number }[];
      };

      // Validate minimum stations
      if (stations.length < 2) {
        return reply.code(400).send({ error: 'At least 2 stations required' });
      }

      // Validate station IDs exist
      const stationIds = stations.map((s) => s.stationId);
      const existingStations = await prisma.station.findMany({
        where: { id: { in: stationIds } },
        select: { id: true },
      });

      if (existingStations.length !== stationIds.length) {
        return reply.code(400).send({ error: 'Some stations do not exist' });
      }

      // Create train route with route stations
      try {
        const trainRoute = await prisma.trainRoute.create({
          data: {
            name,
            startStationId: stations[0].stationId,
            endStationId: stations[stations.length - 1].stationId,
            routeStations: {
              create: stations.map((station, index) => ({
                previousStationId: index > 0 ? stations[index - 1].stationId : null,
                currentStationId: station.stationId,
                nextStationId: index < stations.length - 1 ? stations[index + 1].stationId : null,
                distance: index < stations.length - 1 ? station.distance : null,
                distanceFromStart: stations
                  .slice(0, index + 1)
                  .reduce((sum, s) => sum + (s.distance || 0), 0),
              })),
            },
          },
          include: {
            startStation: true,
            endStation: true,
            routeStations: {
              select: {
                id: true,
                previousStationId: true,
                currentStationId: true,
                nextStationId: true,
                distance: true,
                distanceFromStart: true,
              },
              orderBy: { distanceFromStart: 'asc' },
            },
          },
        });

        reply.code(201).send(trainRoute);
      } catch (error: any) {
        if (error.code === 'P2002') {
          return reply.code(409).send({ error: 'Train route with this name already exists' });
        }
        throw error;
      }
    },
  );

  // Get all train routes - Admin only
  fastify.get(
    '/train-routes',
    {
      preHandler: (fastify as any).requireAdmin,
      schema: {
        description: 'Get all train routes',
        tags: ['Train Routes'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'array',
            items: trainRouteWithDetailsSchema,
          },
        },
      },
    },
    async (request, reply) => {
      const trainRoutes = await prisma.trainRoute.findMany({
        include: {
          startStation: true,
          endStation: true,
          routeStations: {
            include: {
              currentStation: true,
            },
            orderBy: { distanceFromStart: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      reply.send(trainRoutes);
    },
  );

  // Get train route by ID - Admin only
  fastify.get(
    '/train-routes/:id',
    {
      preHandler: (fastify as any).requireAdmin,
      schema: {
        description: 'Get a train route by ID',
        tags: ['Train Routes'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: trainRouteWithDetailsSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const routeId = parseInt(id, 10);

      if (isNaN(routeId)) {
        return reply.code(400).send({ error: 'Invalid route ID' });
      }

      const trainRoute = await prisma.trainRoute.findUnique({
        where: { id: routeId },
        include: {
          startStation: true,
          endStation: true,
          routeStations: {
            include: {
              currentStation: true,
            },
            orderBy: { distanceFromStart: 'asc' },
          },
        },
      });

      if (!trainRoute) {
        return reply.code(404).send({ error: 'Train route not found' });
      }

      reply.send(trainRoute);
    },
  );
}
