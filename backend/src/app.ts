import fastify from 'fastify'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { PrismaClient } from '@prisma/client/edge'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'
import config from './config'

const connectionString = config.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

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
app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute'
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
        }
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

  // Add more routes here
}, { prefix: config.API_PREFIX })

app.addHook('onClose', async () => {
  await prisma.$disconnect()
  await pool.end()
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