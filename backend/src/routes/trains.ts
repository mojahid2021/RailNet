import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma';
import {
  errorResponseSchema,
  trainWithTimestampsSchema,
  createTrainBodySchema,
  trainsListResponseSchema,
} from '../schemas/index.js';

export default async function trainRoutes(fastify: FastifyInstance) {
  // Create train - Admin only
  fastify.post(
    '/trains',
    {
      preHandler: (fastify as any).requireAdmin,
      schema: {
        description: 'Create a new train with route and compartments (Admin only)',
        tags: ['Trains'],
        security: [{ bearerAuth: [] }],
        body: createTrainBodySchema,
        response: {
          201: trainWithTimestampsSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { name, number, trainRouteId, compartments } = request.body as {
        name: string;
        number: string;
        trainRouteId: number;
        compartments: { compartmentId: number; quantity?: number }[];
      };

      // Validate train route exists
      const trainRoute = await prisma.trainRoute.findUnique({
        where: { id: trainRouteId },
      });

      if (!trainRoute) {
        return reply.code(400).send({ error: 'Train route not found' });
      }

      // Validate compartment IDs exist
      const compartmentIds = compartments.map((c) => c.compartmentId);
      const existingCompartments = await prisma.compartment.findMany({
        where: { id: { in: compartmentIds } },
        select: { id: true },
      });

      if (existingCompartments.length !== compartmentIds.length) {
        return reply.code(400).send({ error: 'Some compartments do not exist' });
      }

      // Create train with compartments
      try {
        const train = await prisma.train.create({
          data: {
            name,
            number,
            trainRouteId,
            compartments: {
              create: compartments.map((comp) => ({
                compartmentId: comp.compartmentId,
                quantity: comp.quantity || 1,
              })),
            },
          },
          include: {
            trainRoute: {
              include: {
                startStation: true,
                endStation: true,
              },
            },
            compartments: {
              include: {
                compartment: true,
              },
            },
          },
        });

        reply.code(201).send(train);
      } catch (error: any) {
        if (error.code === 'P2002') {
          return reply.code(409).send({ error: 'Train with this number already exists' });
        }
        throw error;
      }
    },
  );

  // Get all trains - Authenticated users
  fastify.get(
    '/trains',
    {
      preHandler: (fastify as any).authenticate,
      schema: {
        description: 'Get all trains',
        tags: ['Trains'],
        security: [{ bearerAuth: [] }],
        response: {
          200: trainsListResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const trains = await prisma.train.findMany({
        include: {
          trainRoute: {
            include: {
              startStation: true,
              endStation: true,
            },
          },
          compartments: {
            include: {
              compartment: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      reply.send(trains);
    },
  );

  // Get train by ID - Authenticated users
  fastify.get(
    '/trains/:id',
    {
      preHandler: (fastify as any).authenticate,
      schema: {
        description: 'Get a train by ID',
        tags: ['Trains'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: trainWithTimestampsSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const trainId = parseInt(id);

      if (isNaN(trainId)) {
        return reply.code(400).send({ error: 'Invalid train ID' });
      }

      const train = await prisma.train.findUnique({
        where: { id: trainId },
        include: {
          trainRoute: {
            include: {
              startStation: true,
              endStation: true,
            },
          },
          compartments: {
            include: {
              compartment: true,
            },
          },
        },
      });

      if (!train) {
        return reply.code(404).send({ error: 'Train not found' });
      }

      reply.send(train);
    },
  );
}
