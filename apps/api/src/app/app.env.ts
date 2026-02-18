import { DurationDTO } from '@api/global/data/duration.dto';
import { type Static, t } from 'elysia';

export const EnvironmentDTO = t.Object({
  PORT: t.Number(),

  WEB_ORIGIN: t.String(),

  ANDROID_FINGERPRINT: t.String(),

  JWT_AUTH_SECRET: t.String(),

  POSTGRES_HOSTNAME: t.String(),
  POSTGRES_PORT: t.Number(),
  POSTGRES_DATABASE: t.String(),
  POSTGRES_USERNAME: t.String(),
  POSTGRES_PASSWORD: t.String(),

  REDIS_HOSTNAME: t.String(),
  REDIS_PORT: t.Number(),
  REDIS_USERNAME: t.String(),
  REDIS_PASSWORD: t.String(),

  ACCOUNT_MAX_ALIASES: t.Number(),
  ACCOUNT_ALIAS_EXPIRY_SHORT: DurationDTO,
  ACCOUNT_ALIAS_EXPIRY_LONG: DurationDTO,

  GOOGLE_APPLICATION_CREDENTIALS: t.String(),

  FIREBASE_NOTIFICATION_DATABASE_URL: t.String(),
});

export type Environment = Static<typeof EnvironmentDTO>;
