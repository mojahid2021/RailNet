import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.string().default('info'),
  API_PREFIX: z.string().default('/api/v1'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  BASE_URL: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
})

const config = envSchema.parse(process.env)

export default config