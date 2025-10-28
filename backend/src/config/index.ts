import dotenv from 'dotenv';
import Joi from 'joi';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Define validation schema for environment variables
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  HOST: Joi.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),

  // Redis (optional for caching/rate limiting)
  REDIS_URL: Joi.string().optional(),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),

  // CORS
  CORS_ORIGIN: Joi.string().default('*'),

  // Rate Limiting
  RATE_LIMIT_MAX: Joi.number().default(100),
  RATE_LIMIT_TIME_WINDOW: Joi.number().default(15 * 60 * 1000), // 15 minutes

  // API
  API_VERSION: Joi.string().default('v1'),
  API_PREFIX: Joi.string().default('/api'),
}).unknown(true);

// Validate environment variables
const { error, value } = envSchema.validate(process.env, {
  allowUnknown: true,
  stripUnknown: false,
});

if (error) {
  throw new Error(`Environment validation error: ${error.details[0].message}`);
}

// Export validated configuration
export const config = {
  env: value.NODE_ENV,
  port: value.PORT,
  host: value.HOST,

  database: {
    url: value.DATABASE_URL,
  },

  jwt: {
    secret: value.JWT_SECRET,
    expiresIn: value.JWT_EXPIRES_IN,
  },

  redis: {
    url: value.REDIS_URL,
  },

  logging: {
    level: value.LOG_LEVEL,
  },

  cors: {
    origin: value.CORS_ORIGIN,
  },

  rateLimit: {
    max: value.RATE_LIMIT_MAX,
    timeWindow: value.RATE_LIMIT_TIME_WINDOW,
  },

  api: {
    version: value.API_VERSION,
    prefix: value.API_PREFIX,
  },

  isDevelopment: value.NODE_ENV === 'development',
  isProduction: value.NODE_ENV === 'production',
  isTest: value.NODE_ENV === 'test',
} as const;

export type Config = typeof config;