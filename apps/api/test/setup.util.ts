import { afterAll, beforeAll } from 'bun:test';
import type { Environment } from '@api/app/app.env';
import { DatabaseGlobal } from '@api/db/db.global';
import type { IntegrationTestOptions } from '@bltx/test';
import { type AnyElysia, Elysia } from 'elysia';
import { FixtureService } from './fixture.service';
import { DatabaseMock } from './mocks/db.mock';
import { EnvironmentMock } from './mocks/env.mock';
import { FirebaseMock } from './mocks/firebase.mock';
import { RedisMock } from './mocks/redis.mock';
import { ENVIRONMENT } from './test.env';

declare global {
  interface ImportMetaEnv {
    CI: unknown;
  }
}

export const setupIntegrationTest = (
  controller: AnyElysia,
  { env: envOverrides, timeout = import.meta.env.CI ? 30000 : 20000, use }: IntegrationTestOptions<Environment> = {},
) => {
  const env = { ...ENVIRONMENT, ...envOverrides };
  let app: AnyElysia;

  // TODO: update this once bun fixes this issue
  // https://github.com/oven-sh/bun/issues/23133

  beforeAll(
    null,
    async () => {
      EnvironmentMock.init(env);
      await DatabaseMock.init();
      await RedisMock.init();
      FirebaseMock.init();

      app = new Elysia();
      app = use?.(app) ?? app;
      app = app.use(controller);
      await app.modules;
    },
    // @ts-expect-error
    timeout,
  );

  afterAll(
    null,
    async () => {
      await DatabaseMock.teardown();
    },
    // @ts-expect-error
    timeout,
  );

  return {
    app: () => app,
    env: () => env,
    db: () => DatabaseGlobal.client,
    fixture: () => new FixtureService(DatabaseGlobal.client),
  };
};
