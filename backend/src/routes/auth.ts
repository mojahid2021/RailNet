import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
import {
  errorResponseSchema,
  authResponseSchema,
  registerBodySchema,
  loginBodySchema,
  userSchema,
} from '../schemas/index.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
  }
}

export default async function authRoutes(fastify: FastifyInstance) {
  // Register route
  fastify.post(
    '/register',
    {
      schema: {
        description: 'Register a new user',
        tags: ['Authentication'],
        body: registerBodySchema,
        response: {
          200: authResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { email, password, firstName, lastName, phone, address, role } = request.body as {
        email: string;
        password: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        address?: string;
        role?: string;
      };

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return reply.code(400).send({ error: 'User already exists' });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create the user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          address,
          role: role || 'user', // Default to 'user' if not provided
        },
      });

      // Generate JWT token
      const token = fastify.jwt.sign({ id: user.id, email: user.email, role: user.role });

      reply.send({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          address: user.address,
          role: user.role,
        },
        token,
      });
    },
  );

  // Login route
  fastify.post(
    '/login',
    {
      schema: {
        description: 'Login a user',
        tags: ['Authentication'],
        body: loginBodySchema,
        response: {
          200: authResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body as { email: string; password: string };

      // Find the user
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = fastify.jwt.sign({ id: user.id, email: user.email, role: user.role });

      reply.send({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          address: user.address,
          role: user.role,
        },
        token,
      });
    },
  );

  // Profile route
  fastify.get(
    '/profile',
    {
      preHandler: fastify.authenticate,
      schema: {
        description: 'Get authenticated user profile',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        response: {
          200: userSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.user as { id: number };

      // Fetch the user from database
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          address: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      reply.send(user);
    },
  );

  // Get all users - Admin only
  fastify.get(
    '/admin/users',
    {
      preHandler: (fastify as any).requireAdmin,
      schema: {
        description: 'Get all users with filtering and pagination (Admin only)',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            role: {
              type: 'string',
              enum: ['user', 'admin']
            },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phone: { type: 'string' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              users: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    email: { type: 'string' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    phone: { type: 'string' },
                    address: { type: 'string' },
                    role: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    _count: {
                      type: 'object',
                      properties: {
                        tickets: { type: 'number' },
                      },
                    },
                  },
                },
              },
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
              totalPages: { type: 'integer' },
            },
          },
          403: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const user = request.user as { role: string };

      if (user.role !== 'admin') {
        return reply.code(403).send({ error: 'Admin access required' });
      }

      const query = request.query as {
        page?: number;
        limit?: number;
        role?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        startDate?: string;
        endDate?: string;
      };

      const page = query.page || 1;
      const limit = Math.min(query.limit || 20, 100);
      const offset = (page - 1) * limit;

      const where: any = {};

      // Role filter
      if (query.role) {
        where.role = query.role;
      }

      // Email filter (partial match)
      if (query.email) {
        where.email = {
          contains: query.email,
          mode: 'insensitive',
        };
      }

      // Name filters (partial match)
      if (query.firstName) {
        where.firstName = {
          contains: query.firstName,
          mode: 'insensitive',
        };
      }

      if (query.lastName) {
        where.lastName = {
          contains: query.lastName,
          mode: 'insensitive',
        };
      }

      // Phone filter (partial match)
      if (query.phone) {
        where.phone = {
          contains: query.phone,
          mode: 'insensitive',
        };
      }

      // Date range filters
      if (query.startDate || query.endDate) {
        where.createdAt = {};
        if (query.startDate) {
          where.createdAt.gte = new Date(query.startDate);
        }
        if (query.endDate) {
          where.createdAt.lte = new Date(query.endDate + 'T23:59:59.999Z');
        }
      }

      try {
        const [users, total] = await Promise.all([
          prisma.user.findMany({
            where,
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              address: true,
              role: true,
              createdAt: true,
              updatedAt: true,
              _count: {
                select: {
                  tickets: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limit,
          }),
          prisma.user.count({
            where,
          }),
        ]);

        const totalPages = Math.ceil(total / limit);

        reply.send({
          users,
          page,
          limit,
          total,
          totalPages,
        });
      } catch (error) {
        console.error('Admin user retrieval error:', error);
        reply.code(500).send({
          error: error instanceof Error ? error.message : 'User retrieval failed',
        });
      }
    },
  );
}
