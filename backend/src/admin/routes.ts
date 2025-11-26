import { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'
import { registerAdminSchema, RegisterAdminInput, loginAdminSchema, LoginAdminInput } from '../schemas/admin'
import { ResponseHandler } from '../shared/utils/response.handler'
import { ConflictError, NotFoundError } from '../shared/errors'
import { JWTUtil } from '../shared/utils/jwt.util'
import { authenticateAdmin } from '../shared/middleware/auth.middleware'

export async function adminRoutes(app: FastifyInstance) {
  app.post('/register', {
    schema: {
      description: 'Register a new admin',
      tags: ['admin'],
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
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            admin: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                email: { type: 'string' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        409: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { firstName, lastName, email, password }: RegisterAdminInput = registerAdminSchema.parse(request.body)

      const existingAdmin = await (app as any).prisma.admin.findUnique({
        where: { email },
      })

      if (existingAdmin) {
        throw new ConflictError('Admin with this email already exists')
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      const admin = await (app as any).prisma.admin.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
        },
      })

      return ResponseHandler.created(reply, admin, 'Admin registered successfully')
    } catch (error) {
      if (error instanceof ConflictError) {
        return ResponseHandler.conflict(reply, error.message)
      }
      // For Zod errors or other errors
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
    }
  })

  app.post('/login', {
    schema: {
      description: 'Login admin',
      tags: ['admin'],
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
                token: { type: 'string' },
                admin: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { email, password }: LoginAdminInput = loginAdminSchema.parse(request.body)

      const admin = await (app as any).prisma.admin.findUnique({
        where: { email },
      })

      if (!admin) {
        throw new NotFoundError('Invalid credentials')
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password)
      if (!isPasswordValid) {
        throw new NotFoundError('Invalid credentials')
      }

      const token = JWTUtil.generateToken({
        id: admin.id,
        email: admin.email,
        type: 'admin',
      })

      const adminData = {
        id: admin.id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
      }

      return ResponseHandler.success(reply, { token, admin: adminData }, 'Login successful')
    } catch (error) {
      if (error instanceof NotFoundError) {
        return ResponseHandler.error(reply, 'Invalid credentials', 401)
      }
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
    }
  })

  app.get('/profile', {
    preHandler: authenticateAdmin,
    schema: {
      description: 'Get admin profile',
      tags: ['admin'],
      security: [{ apiKey: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                email: { type: 'string' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const adminId = request.admin!.id

      const admin = await (app as any).prisma.admin.findUnique({
        where: { id: adminId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      if (!admin) {
        throw new NotFoundError('Admin not found')
      }

      return ResponseHandler.success(reply, admin)
    } catch (error) {
      return ResponseHandler.error(reply, error instanceof Error ? error.message : 'Internal server error', 500)
    }
  })
}