/**
 * Admin Authentication Controller
 * 
 * Handles admin authentication endpoints
 */

import { FastifyInstance } from 'fastify';
import { authService } from '../services/auth.service';
import { RegisterAdminSchema, LoginSchema } from '../dtos';
import { ResponseHandler } from '../../../shared/utils/response.handler';
import { authenticateAdmin } from '../../../shared/middleware';
import { ConflictError, NotFoundError } from '../../../shared/errors';

export async function adminAuthRoutes(app: FastifyInstance) {
  app.post('/register', {
    schema: {
      description: 'Register a new admin',
      tags: ['admin-auth'],
      body: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'password'],
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const data = RegisterAdminSchema.parse(request.body);
      const admin = await authService.registerAdmin(data);
      return ResponseHandler.created(reply, admin, 'Admin registered successfully');
    } catch (error) {
      if (error instanceof ConflictError) {
        return ResponseHandler.conflict(reply, error.message);
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  });

  app.post('/login', {
    schema: {
      description: 'Login admin',
      tags: ['admin-auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const data = LoginSchema.parse(request.body);
      const result = await authService.loginAdmin(data);
      return ResponseHandler.success(reply, result, 'Login successful');
    } catch (error) {
      if (error instanceof NotFoundError) {
        return ResponseHandler.unauthorized(reply, 'Invalid credentials');
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  });

  app.get('/profile', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Get admin profile',
      tags: ['admin-auth'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    try {
      const adminId = request.admin!.id;
      const admin = await authService.getAdminProfile(adminId);
      return ResponseHandler.success(reply, admin);
    } catch (error) {
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  });
}
