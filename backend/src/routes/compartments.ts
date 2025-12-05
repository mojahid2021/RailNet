import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { errorResponseSchema, compartmentWithTimestampsSchema, createCompartmentBodySchema, compartmentsListResponseSchema } from '../schemas/index.js';

const prisma = new PrismaClient();

export default async function compartmentRoutes(fastify: FastifyInstance) {
  // Create compartment - Admin only
  fastify.post('/compartments', {
    preHandler: (fastify as any).requireAdmin,
    schema: {
      description: 'Create a new compartment (Admin only)',
      tags: ['Compartments'],
      security: [{ bearerAuth: [] }],
      body: createCompartmentBodySchema,
      response: {
        201: compartmentWithTimestampsSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        403: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const { name, class: compartmentClass, type, price, totalSeats } = request.body as {
      name: string;
      class: string;
      type: string;
      price: number;
      totalSeats: number;
    };

    const compartment = await prisma.compartment.create({
      data: {
        name,
        class: compartmentClass,
        type,
        price,
        totalSeats,
      },
    });

    reply.code(201).send(compartment);
  });

  // Get all compartments - Authenticated users
  fastify.get('/compartments', {
    preHandler: (fastify as any).authenticate,
    schema: {
      description: 'Get all compartments',
      tags: ['Compartments'],
      security: [{ bearerAuth: [] }],
      response: {
        200: compartmentsListResponseSchema,
      },
    },
  }, async (request, reply) => {
    const compartments = await prisma.compartment.findMany({
      orderBy: { createdAt: 'desc' },
    });

    reply.send(compartments);
  });

  // Get compartment by ID - Authenticated users
  fastify.get('/compartments/:id', {
    preHandler: (fastify as any).authenticate,
    schema: {
      description: 'Get a compartment by ID',
      tags: ['Compartments'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: compartmentWithTimestampsSchema,
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const compartmentId = parseInt(id);

    if (isNaN(compartmentId)) {
      return reply.code(400).send({ error: 'Invalid compartment ID' });
    }

    const compartment = await prisma.compartment.findUnique({
      where: { id: compartmentId },
    });

    if (!compartment) {
      return reply.code(404).send({ error: 'Compartment not found' });
    }

    reply.send(compartment);
  });
}