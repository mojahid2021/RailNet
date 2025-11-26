/**
 * User Authentication Controller
 * 
 * Handles user authentication endpoints
 */

import { FastifyInstance } from 'fastify';
import { authService } from '../services/auth.service';
import { RegisterUserSchema, LoginSchema } from '../dtos';
import { ResponseHandler } from '../../../shared/utils/response.handler';
import { ConflictError, NotFoundError } from '../../../shared/errors';

export async function userAuthRoutes(app: FastifyInstance) {
  app.post('/register', {
    schema: {
      description: 'Register a new user account',
      tags: ['user-auth'],
      body: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'password'],
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          phone: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const data = RegisterUserSchema.parse(request.body);
      const user = await authService.registerUser(data);
      return ResponseHandler.created(reply, user, 'User registered successfully');
    } catch (error) {
      if (error instanceof ConflictError) {
        return ResponseHandler.conflict(reply, error.message);
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  });

  app.post('/login', {
    schema: {
      description: 'Login with user credentials',
      tags: ['user-auth'],
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
      const result = await authService.loginUser(data);
      return ResponseHandler.success(reply, result, 'Login successful');
    } catch (error) {
      if (error instanceof NotFoundError) {
        return ResponseHandler.unauthorized(reply, 'Invalid credentials');
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  });
}
