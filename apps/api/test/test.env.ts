import type { Environment } from '@api/app/app.env';

export const ENVIRONMENT = {
  PORT: 8080,

  WEB_ORIGIN: 'localhost',

  JWT_AUTH_SECRET: 'test',

  POSTGRES_HOSTNAME: 'localhost',
  POSTGRES_PORT: 5432,
  POSTGRES_DATABASE: 'test',
  POSTGRES_USERNAME: 'test',
  POSTGRES_PASSWORD: 'test',

  REDIS_HOSTNAME: 'localhost',
  REDIS_PORT: 6379,
  REDIS_USERNAME: 'test',
  REDIS_PASSWORD: 'test',

  ACCOUNT_MAX_ALIASES: 3,
  ACCOUNT_ALIAS_EXPIRY_SHORT: 1000,
  ACCOUNT_ALIAS_EXPIRY_LONG: 10000,

  GOOGLE_APPLICATION_CREDENTIALS: '{}',

  FIREBASE_NOTIFICATION_DATABASE_URL: 'localhost',
} satisfies Environment;
