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
      const { email, password, firstName, lastName, role } = request.body as {
        email: string;
        password: string;
        firstName?: string;
        lastName?: string;
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
}
