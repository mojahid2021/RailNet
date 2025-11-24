import fastify from 'fastify'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import config from './config'
import { AppError } from './errors'

const prisma = new PrismaClient()

const app = fastify({ 
  logger: { 
    level: config.LOG_LEVEL
  } 
})

app.decorate('prisma', prisma)

app.register(helmet)
app.register(cors, {
  origin: true // Allow all origins for development; configure for production
})
app.setErrorHandler((error, request, reply) => {
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      success: false,
      error: error.message,
    })
  }

  // Log unexpected errors
  app.log.error(error)

  return reply.code(500).send({
    success: false,
    error: 'Internal server error',
  })
})

app.register(swagger, {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'RailNet API',
      description: 'API for RailNet backend',
      version: '1.0.0'
    },
    servers: [
      {
        url: `http://${config.HOST === '0.0.0.0' ? 'localhost' : config.HOST}:${config.PORT}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          name: 'apiKey',
          in: 'header'
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      }
    }
  }
})

app.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  },
  staticCSP: true,
  transformStaticCSP: (header) => header
})

// Routes
app.register(async (app) => {
  app.get('/', {
    schema: {
      description: 'Health check endpoint',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    return { status: 'Server is running...' }
  })

  // Admin routes
  app.register(async (adminApp) => {
    const { adminRoutes } = await import('./admin/routes')
    await adminRoutes(adminApp)
  }, { prefix: '/admin' })

  // Station routes
  app.register(async (stationApp) => {
    const { stationRoutes } = await import('./admin/stations')
    await stationRoutes(stationApp)
  }, { prefix: '/stations' })

  // Train route routes
  app.register(async (trainRouteApp) => {
    const { trainRoutes } = await import('./admin/trainRoutes')
    await trainRoutes(trainRouteApp)
  }, { prefix: '/train-routes' })

  // Compartment routes
  app.register(async (compartmentApp) => {
    const { compartmentRoutes } = await import('./admin/compartments')
    await compartmentRoutes(compartmentApp)
  }, { prefix: '/compartments' })

  // Train routes
  app.register(async (trainApp) => {
    const { trainRoutes } = await import('./admin/trains')
    await trainRoutes(trainApp)
  }, { prefix: '/trains' })

  // Add more routes here
}, { prefix: config.API_PREFIX })

app.addHook('onClose', async () => {
  await prisma.$disconnect()
})

const start = async () => {
  try {
    await app.listen({ port: config.PORT, host: config.HOST })
    console.log(`Server listening on http://${config.HOST}:${config.PORT}`)
    console.log(`API documentation available at http://${config.HOST}:${config.PORT}/docs`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()