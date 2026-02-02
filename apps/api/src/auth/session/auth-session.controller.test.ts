import { describe, expect, test } from 'bun:test';
import type { Environment } from '@api/app/app.env';
import { insertOne } from '@bltx/db';
import { MockRequest, type Serialized } from '@bltx/test';
import { setupIntegrationTest } from '@test/setup.util';
import { eq } from 'drizzle-orm';
import { AuthSessionDB } from '../data/auth-session.db';
import type { Authenticated } from '../data/authenticated.res';
import { AuthSessionController } from './auth-session.controller';
import { AuthSessionService } from './auth-session.service';

const ENVIRONMENT = {
  JWT_AUTH_SECRET: 'secret',
} as Environment;

describe('AuthSessionController', () => {
  describe('GET /auth/session', () => {
    const { app, db, fixture } = setupIntegrationTest(AuthSessionController, { env: ENVIRONMENT });

    const request = (accessToken: string): Promise<Serialized<Authenticated>> =>
      app()
        .handle(
          new MockRequest('/auth/session', {
            method: 'get',
            headers: {
              cookie: new Bun.Cookie('accessToken', accessToken).serialize(),
            },
          }),
        )
        .then((res) => res.json());

    test('get active session', async () => {
      const { account, credential } = await fixture().createAccount();
      const session = await insertOne(db(), AuthSessionDB, { credentialID: credential.id });
      const accessToken = await new AuthSessionService(db(), {
        JWT_AUTH_SECRET: 'secret',
      } as Environment).accessToken.sign({
        sessionID: session.id,
      });

      const result = await request(accessToken);

      expect(result).toEqual({
        account: expect.objectContaining({
          id: account.id,
          username: account.username,
          families: [],
          networks: [],
        }),
      });
    });
  });

  describe('DELETE /auth/session', () => {
    const { app, db, fixture } = setupIntegrationTest(AuthSessionController, { env: ENVIRONMENT });

    const request = (accessToken: string) =>
      app().handle(
        new MockRequest('/auth/session', {
          method: 'delete',
          headers: {
            cookie: new Bun.Cookie('accessToken', accessToken).serialize(),
          },
        }),
      );

    test('delete active session', async () => {
      const { credential } = await fixture().createAccount();
      const session = await insertOne(db(), AuthSessionDB, { credentialID: credential.id });
      const accessToken = await new AuthSessionService(db(), {
        JWT_AUTH_SECRET: 'secret',
      } as Environment).accessToken.sign({
        sessionID: session.id,
      });

      await request(accessToken);

      expect(await db().$count(AuthSessionDB, eq(AuthSessionDB.credentialID, credential.id))).toBe(0);
    });
  });
});
