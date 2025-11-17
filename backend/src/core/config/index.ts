/**
 * Core configuration management for RailNet Backend
 * Provides type-safe, validated configuration with environment-specific settings
 */

import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Environment schema validation
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().url().refine(
    (url) => url.startsWith('postgresql://'),
    'DATABASE_URL must be a valid PostgreSQL connection string'
  ),

  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(8).max(16).default(12),

  // Redis (optional)
  REDIS_URL: z.string().url().optional(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE_PATH: z.string().default('./logs/app.log'),

  // CORS
  CORS_ORIGIN: z.string().default('*'),

  // Rate Limiting
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_TIME_WINDOW: z.coerce.number().int().positive().default(15 * 60 * 1000), // 15 minutes

  // API Configuration
  API_VERSION: z.string().default('v1'),
  API_PREFIX: z.string().default('/api'),

  // Security
  SECURITY_HELMET_ENABLED: z.coerce.boolean().default(true),
  SECURITY_CORS_ENABLED: z.coerce.boolean().default(true),
  SECURITY_RATE_LIMIT_ENABLED: z.coerce.boolean().default(true),

  // External Services (placeholders for future use)
  EMAIL_SERVICE_URL: z.string().url().optional(),
  STORAGE_SERVICE_URL: z.string().url().optional(),
});

// Parse and validate environment variables
const envParseResult = envSchema.safeParse(process.env);

if (!envParseResult.success) {
  console.error('❌ Environment validation failed:');
  envParseResult.error.issues.forEach((error) => {
    console.error(`  - ${error.path.join('.')}: ${error.message}`);
  });
  process.exit(1);
}

const env = envParseResult.data;

/**
 * Application configuration object
 * All configuration values are validated and type-safe
 */
export const config = {
  // Application
  app: {
    env: env.NODE_ENV,
    port: env.PORT,
    host: env.HOST,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
  },

  // Database
  database: {
    url: env.DATABASE_URL,
  },

  // Authentication & Security
  auth: {
    jwt: {
      secret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRES_IN,
    },
    bcrypt: {
      rounds: env.BCRYPT_ROUNDS,
    },
  },

  // External Services
  redis: env.REDIS_URL ? { url: env.REDIS_URL } : null,

  // Logging
  logging: {
    level: env.LOG_LEVEL,
    filePath: env.LOG_FILE_PATH,
  },

  // Security
  security: {
    cors: {
      enabled: env.SECURITY_CORS_ENABLED,
      origin: env.CORS_ORIGIN,
    },
    helmet: {
      enabled: env.SECURITY_HELMET_ENABLED,
    },
    rateLimit: {
      enabled: env.SECURITY_RATE_LIMIT_ENABLED,
      max: env.RATE_LIMIT_MAX,
      timeWindow: env.RATE_LIMIT_TIME_WINDOW,
    },
  },

  // API
  api: {
    version: env.API_VERSION,
    prefix: env.API_PREFIX,
    basePath: `${env.API_PREFIX}/${env.API_VERSION}`,
  },

  // External Services (for future use)
  services: {
    email: env.EMAIL_SERVICE_URL,
    storage: env.STORAGE_SERVICE_URL,
  },
} as const;

/**
 * Type definition for the configuration object
 */
export type Config = typeof config;

/**
 * Helper function to get configuration value with type safety
 */
export function getConfig<K extends keyof Config>(key: K): Config[K] {
  return config[key];
}

/**
 * Helper function to check if a service is configured
 */
export function isServiceEnabled(service: keyof Config['services']): boolean {
  return config.services[service] !== undefined;
}