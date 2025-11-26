/**
 * User Authentication Controller
 * 
 * Handles user authentication endpoints
 */

import { FastifyInstance } from 'fastify';
import { authService } from '../services/auth.service';
import { RegisterUserSchema, LoginSchema } from '../dtos';
import { ResponseHandler, ErrorHandlerUtil } from '../../../shared/utils';

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
      return ErrorHandlerUtil.handle(reply, error);
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
      return ErrorHandlerUtil.handle(reply, error);
    }
  });
}
