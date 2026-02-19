/**
 * Environment Variable Validation
 * Validates that all required environment variables are set at runtime
 * Fails fast on server startup if critical vars are missing
 */

interface EnvConfig {
  // Database
  DATABASE_URL: string;

  // Redis
  REDIS_URL: string;

  // JWT
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRY?: string;
  JWT_REFRESH_EXPIRY?: string;

  // AWS
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_S3_BUCKET: string;

  // Email
  EMAIL_PROVIDER: string;
  SENDGRID_API_KEY?: string;
  AWS_SES_REGION?: string;
  AWS_SES_FROM_EMAIL?: string;

  // App
  NODE_ENV: string;
  NEXT_PUBLIC_APP_URL: string;

  // Optional
  LOG_LEVEL?: string;
  API_TIMEOUT?: string;
  MAX_REQUEST_SIZE?: string;
  DATABASE_POOL_MAX?: string;
  DATABASE_POOL_MIN?: string;
}

/**
 * Required environment variables that must be set
 * Add more based on your deployment requirements
 */
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET',
  'EMAIL_PROVIDER',
  'NODE_ENV',
  'NEXT_PUBLIC_APP_URL',
];

/**
 * Validate environment variables at startup
 * Throws error if required vars are missing
 */
export function validateEnv(): EnvConfig {
  const missingVars: string[] = [];

  // Check required variables
  REQUIRED_ENV_VARS.forEach((varName) => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Fail fast if any required vars are missing
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missingVars.map((v) => `  - ${v}`).join('\n')}\n\nPlease check your .env.local file.`
    );
  }

  // Validate JWT secret length (minimum 32 chars for security)
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn(
      'Warning: JWT_SECRET should be at least 32 characters for security. Current length:',
      process.env.JWT_SECRET.length
    );
  }

  return {
    // Database
    DATABASE_URL: process.env.DATABASE_URL || '',

    // Redis
    REDIS_URL: process.env.REDIS_URL || '',

    // JWT
    JWT_SECRET: process.env.JWT_SECRET || '',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
    JWT_EXPIRY: process.env.JWT_EXPIRY || '15m',
    JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',

    // AWS
    AWS_REGION: process.env.AWS_REGION || '',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || '',

    // Email
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || '',
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    AWS_SES_REGION: process.env.AWS_SES_REGION,
    AWS_SES_FROM_EMAIL: process.env.AWS_SES_FROM_EMAIL,

    // App
    NODE_ENV: process.env.NODE_ENV || 'development',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '',

    // Optional
    LOG_LEVEL: process.env.LOG_LEVEL,
    API_TIMEOUT: process.env.API_TIMEOUT,
    MAX_REQUEST_SIZE: process.env.MAX_REQUEST_SIZE,
    DATABASE_POOL_MAX: process.env.DATABASE_POOL_MAX,
    DATABASE_POOL_MIN: process.env.DATABASE_POOL_MIN,
  };
}

/**
 * Get environment config (validated)
 * Call this at app startup, e.g., in _app.tsx or API route handler
 */
export const env: EnvConfig = validateEnv();

/**
 * Type-safe access to environment variables
 * Usage: config.DATABASE_URL (with type checking)
 */
export const config = env;

/**
 * Check if running in production
 */
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * Check if running in development
 */
export const isDevelopment = process.env.NODE_ENV === 'development';
