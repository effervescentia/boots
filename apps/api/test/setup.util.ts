import type { Environment } from '@api/app/app.env';
// biome-ignore lint/style/noRestrictedImports: allowed here
import * as schema from '@api/db/db.schema';
import { type IntegrationTestOptions, integrationTestFactory } from '@bltx/test';
import type { AnyElysia } from 'elysia';
import { FixtureService } from './fixture.service';

declare global {
  interface ImportMetaEnv {
    CI: unknown;
  }
}

export const setupIntegrationTest = (controller: AnyElysia, options?: IntegrationTestOptions<Environment>) => {
  const helpers = integrationTestFactory({
    schema,
    env: {
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
    } satisfies Environment,
    timeout: import.meta.env.CI ? 30000 : 20000,
  })(controller, options);

  return {
    ...helpers,
    fixture: () => new FixtureService(helpers.db(), helpers.env() as Environment),
  };
};
