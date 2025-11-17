/**
 * Authentication routes for RailNet Backend
 * Handles user registration, login, and profile management
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { appLogger } from '../../core/logger';
import { HTTP_STATUS } from '../../shared/constants';
import { AuthService } from './service';
import { RegisterData, LoginCredentials } from '../../types/common';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
           'Password must contain uppercase, lowercase, number, and special character'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
});

const adminRegisterStaffSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
           'Password must contain uppercase, lowercase, number, and special character'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
});

const adminRegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
           'Password must contain uppercase, lowercase, number, and special character'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Authentication routes
 */
export const createAuthRoutes = (): FastifyPluginAsync => {
  return async (server) => {
    // Initialize auth service
    const authService = new AuthService();

    /**
     * Register a new user
     */
    server.post('/register', {
      schema: {
        description: 'Register a new user account',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            firstName: { type: 'string', minLength: 1, maxLength: 50 },
            lastName: { type: 'string', minLength: 1, maxLength: 50 },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      email: { type: 'string' },
                      firstName: { type: 'string' },
                      lastName: { type: 'string' },
                      role: { type: 'string' },
                    },
                  },
                  token: { type: 'string' },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    }, async (request, reply) => {
      try {
        // Validate request body
        const validation = registerSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(HTTP_STATUS.BAD_REQUEST).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input data',
              details: validation.error.issues,
            },
            timestamp: new Date().toISOString(),
          });
        }

        const userData: RegisterData = {
          ...validation.data,
          role: 'PASSENGER',
        };

        // Register user
        const result = await authService.register(userData);

        appLogger.info('User registration successful', {
          userId: result.user.id,
          email: result.user.email,
        });

        return reply.status(HTTP_STATUS.CREATED).send({
          success: true,
          message: 'User registered successfully',
          data: result,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('User registration failed', { error });

        const statusCode = (error as { name?: string }).name === 'ConflictError' ? HTTP_STATUS.CONFLICT : HTTP_STATUS.BAD_REQUEST;

        return reply.status(statusCode).send({
          success: false,
          error: {
            code: (error as { code?: string }).code || 'REGISTRATION_ERROR',
            message: (error as { message?: string }).message || 'Registration failed',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Register a new admin user (separate endpoint)
     */
    server.post('/admin/register', {
      schema: {
        description: 'Register a new admin account',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            firstName: { type: 'string', minLength: 1, maxLength: 50 },
            lastName: { type: 'string', minLength: 1, maxLength: 50 },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      email: { type: 'string' },
                      firstName: { type: 'string' },
                      lastName: { type: 'string' },
                      role: { type: 'string' },
                    },
                  },
                  token: { type: 'string' },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    }, async (request, reply) => {
      try {
        // Validate request body
        const validation = adminRegisterSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(HTTP_STATUS.BAD_REQUEST).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input data',
              details: validation.error.issues,
            },
            timestamp: new Date().toISOString(),
          });
        }

        const userData: RegisterData = {
          ...validation.data,
          role: 'ADMIN',
        };

        // Register admin user
        const result = await authService.register(userData);

        appLogger.info('Admin registration successful', {
          userId: result.user.id,
          email: result.user.email,
        });

        return reply.status(HTTP_STATUS.CREATED).send({
          success: true,
          message: 'Admin registered successfully',
          data: result,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Admin registration failed', { error });

        const statusCode = (error as { name?: string }).name === 'ConflictError' ? HTTP_STATUS.CONFLICT : HTTP_STATUS.BAD_REQUEST;

        return reply.status(statusCode).send({
          success: false,
          error: {
            code: (error as { code?: string }).code || 'REGISTRATION_ERROR',
            message: (error as { message?: string }).message || 'Registration failed',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Register a new staff user (admin only)
     */
    server.post('/admin/register-staff', {
      schema: {
        description: 'Register a new staff account (admin only)',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            firstName: { type: 'string', minLength: 1, maxLength: 50 },
            lastName: { type: 'string', minLength: 1, maxLength: 50 },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      email: { type: 'string' },
                      firstName: { type: 'string' },
                      lastName: { type: 'string' },
                      role: { type: 'string' },
                    },
                  },
                  token: { type: 'string' },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
          403: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      preHandler: (server as unknown as { auth: Function; authenticate: Function }).auth([(server as unknown as { auth: Function; authenticate: Function }).authenticate]),
    }, async (request, reply) => {
      try {
        const user = request.user as { userId: string; email: string; role: string };

        // Check if user is admin
        if (user.role !== 'ADMIN') {
          return reply.status(HTTP_STATUS.FORBIDDEN).send({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Only administrators can register staff accounts',
            },
            timestamp: new Date().toISOString(),
          });
        }

        // Validate request body
        const validation = adminRegisterStaffSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(HTTP_STATUS.BAD_REQUEST).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input data',
              details: validation.error.issues,
            },
            timestamp: new Date().toISOString(),
          });
        }

        const userData: RegisterData = {
          ...validation.data,
          role: 'STAFF',
        };

        // Register staff user
        const result = await authService.register(userData);

        appLogger.info('Staff registration successful', {
          userId: result.user.id,
          email: result.user.email,
          registeredBy: user.userId,
        });

        return reply.status(HTTP_STATUS.CREATED).send({
          success: true,
          message: 'Staff registered successfully',
          data: result,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Staff registration failed', { error });

        const statusCode = (error as { name?: string }).name === 'ConflictError' ? HTTP_STATUS.CONFLICT : HTTP_STATUS.BAD_REQUEST;

        return reply.status(statusCode).send({
          success: false,
          error: {
            code: (error as { code?: string }).code || 'REGISTRATION_ERROR',
            message: (error as { message?: string }).message || 'Registration failed',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Login passenger user
     */
    server.post('/login', {
      schema: {
        description: 'Authenticate user and return access token',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      email: { type: 'string' },
                      firstName: { type: 'string' },
                      lastName: { type: 'string' },
                      role: { type: 'string' },
                    },
                  },
                  token: { type: 'string' },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
          401: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    }, async (request, reply) => {
      try {
        // Validate request body
        const validation = loginSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(HTTP_STATUS.BAD_REQUEST).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input data',
            },
            timestamp: new Date().toISOString(),
          });
        }

        const credentials: LoginCredentials = validation.data;

        // Authenticate user
        const result = await authService.login(credentials, 'PASSENGER');

        appLogger.info('User login successful', {
          userId: result.user.id,
          email: result.user.email,
        });

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          message: 'Login successful',
          data: result,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('User login failed', {
          email: (request.body as { email?: string })?.email,
          error,
        });

        return reply.status(HTTP_STATUS.UNAUTHORIZED).send({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Invalid email or password',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Login admin user
     */
    server.post('/admin/login', {
      schema: {
        description: 'Authenticate admin user and return access token',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      email: { type: 'string' },
                      firstName: { type: 'string' },
                      lastName: { type: 'string' },
                      role: { type: 'string' },
                    },
                  },
                  token: { type: 'string' },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
          401: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    }, async (request, reply) => {
      try {
        // Validate request body
        const validation = loginSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(HTTP_STATUS.BAD_REQUEST).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input data',
            },
            timestamp: new Date().toISOString(),
          });
        }

        const credentials: LoginCredentials = validation.data;

        // Authenticate admin user
        const result = await authService.login(credentials, 'ADMIN');

        appLogger.info('Admin login successful', {
          userId: result.user.id,
          email: result.user.email,
        });

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          message: 'Admin login successful',
          data: result,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Admin login failed', {
          email: (request.body as { email?: string })?.email,
          error,
        });

        return reply.status(HTTP_STATUS.UNAUTHORIZED).send({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Invalid email or password',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Login staff user
     */
    server.post('/staff/login', {
      schema: {
        description: 'Authenticate staff user and return access token',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      email: { type: 'string' },
                      firstName: { type: 'string' },
                      lastName: { type: 'string' },
                      role: { type: 'string' },
                    },
                  },
                  token: { type: 'string' },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
          401: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    }, async (request, reply) => {
      try {
        // Validate request body
        const validation = loginSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(HTTP_STATUS.BAD_REQUEST).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input data',
            },
            timestamp: new Date().toISOString(),
          });
        }

        const credentials: LoginCredentials = validation.data;

        // Authenticate staff user
        const result = await authService.login(credentials, 'STAFF');

        appLogger.info('Staff login successful', {
          userId: result.user.id,
          email: result.user.email,
        });

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          message: 'Staff login successful',
          data: result,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Staff login failed', {
          email: (request.body as { email?: string })?.email,
          error,
        });

        return reply.status(HTTP_STATUS.UNAUTHORIZED).send({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Invalid email or password',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Get current user profile (protected route)
     */
    server.get('/profile', {
      schema: {
        description: 'Get current user profile information',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  role: { type: 'string' },
                  isActive: { type: 'boolean' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
          401: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      preHandler: (server as unknown as { auth: Function; authenticate: Function }).auth([(server as unknown as { auth: Function; authenticate: Function }).authenticate]),
    }, async (request, reply) => {
      try {
        const user = request.user as { userId: string; email: string; role: string };

        if (!user?.userId) {
          return reply.status(HTTP_STATUS.UNAUTHORIZED).send({
            success: false,
            error: {
              code: 'AUTHENTICATION_ERROR',
              message: 'Authentication required',
            },
            timestamp: new Date().toISOString(),
          });
        }

        // Get user profile
        const profile = await authService.getProfile(user.userId);

        return reply.status(HTTP_STATUS.OK).send({
          success: true,
          data: profile,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        appLogger.error('Failed to get user profile', { error });

        return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
          success: false,
          error: {
            code: 'PROFILE_ERROR',
            message: 'Failed to retrieve profile',
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * Refresh access token (future enhancement)
     */
    server.post('/refresh', {
      schema: {
        description: 'Refresh access token using refresh token',
        tags: ['Authentication'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  token: { type: 'string' },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    }, async (request, reply) => {
      // TODO: Implement token refresh functionality
      return reply.status(HTTP_STATUS.NOT_IMPLEMENTED).send({
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Token refresh not yet implemented',
        },
        timestamp: new Date().toISOString(),
      });
    });

    appLogger.debug('Auth routes registered', {
      routes: ['POST /register', 'POST /admin/register', 'POST /admin/register-staff', 'POST /login', 'POST /admin/login', 'POST /staff/login', 'GET /profile', 'POST /refresh'],
    });
  };
};