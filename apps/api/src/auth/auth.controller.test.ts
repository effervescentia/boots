import { describe, expect, mock, test } from 'bun:test';
import { AccountService } from '@api/account/account.service';
import { AccountDB } from '@api/account/data/account.db';
import type { Environment } from '@api/app/app.env';
import { AuthAlgorithm } from '@api/auth/data/auth-algorithm.enum';
import { AuthTransport } from '@api/auth/data/auth-transport.enum';
import type { DB } from '@api/db/db.types';
import { RedisPlugin } from '@api/redis/redis.plugin';
import { insertOne } from '@bltx/db';
import { MockRequest, type Serialized } from '@bltx/test';
import { parseSetCookie } from '@test/cookie.util';
import { setupIntegrationTest } from '@test/setup.util';
import { eq } from 'drizzle-orm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSessionService } from './auth-session.service';
import { AuthSessionDB } from './data/auth-session.db';
import type { Authenticated } from './data/authenticated.res';
import type { LoginChallenge } from './data/login-challenge.res';
import type { NegotiateLogin } from './data/negotiate-login.req';
import type { NegotiateSignup } from './data/negotiate-signup.req';
import type { SignupChallenge } from './data/signup-challenge.res';
import type { VerifyLogin } from './data/verify-login.req';
import type { VerifySignup } from './data/verify-signup.req';

const verifyRegistration = mock();
const verifyAuthentication = mock();

mock.module('@passwordless-id/webauthn', () => ({
  server: {
    randomChallenge: mock(() => Bun.randomUUIDv7()),
    verifyRegistration,
    verifyAuthentication,
  },
}));

const ENVIRONMENT = {
  JWT_AUTH_SECRET: 'secret',
} as Environment;

describe('AuthController', () => {
  const createAccount = (db: DB) => {
    return new AccountService(db).create({
      id: Bun.randomUUIDv7(),
      publicKey: 'public-key',
      algorithm: AuthAlgorithm.EdDSA,
      transports: [AuthTransport.NFC],
    });
  };

  describe('POST /auth/signup/negotiate', () => {
    const { app } = setupIntegrationTest(AuthController);

    const request = (data: NegotiateSignup) =>
      app().handle(
        new MockRequest('/auth/signup/negotiate', {
          method: 'post',
          json: data,
        }),
      );

    test('negotiate a signup', async () => {
      const response = await request({});
      const result: Serialized<SignupChallenge> = await response.json();
      const cookies = parseSetCookie(response.headers);

      expect(result).toEqual({ challenge: expect.any(String) });
      expect(cookies).toEqual(expect.objectContaining({ signupRequestID: expect.any(String) }));
      expect(
        await RedisPlugin.decorator.redis().hexists(AuthService.SIGNUP_CHALLENGE, cookies['signupRequestID']!),
      ).toBeTrue();
    });
  });

  describe('POST /auth/signup/verify', () => {
    const { app, db } = setupIntegrationTest(AuthController);

    const request = (signupRequestID: string, data: VerifySignup) =>
      app().handle(
        new MockRequest('/auth/signup/verify', {
          method: 'post',
          json: data,
          headers: {
            cookie: new Bun.Cookie('signupRequestID', signupRequestID).serialize(),
          },
        }),
      );

    test('complete signup', async () => {
      const data: VerifySignup = {
        registration: {
          type: 'public-key',
          id: 'registration-id',
          rawId: 'raw-id',
          user: { name: 'user-name' },
          response: {
            attestationObject: '',
            authenticatorData: '',
            clientDataJSON: '',
            publicKey: '',
            publicKeyAlgorithm: 0,
            transports: ['nfc'],
          },
          clientExtensionResults: {},
        },
      };
      const { requestID } = await new AuthService(db(), RedisPlugin.decorator.redis(), ENVIRONMENT).negotiateSignup({});

      verifyRegistration.mockResolvedValue({
        synced: true,
        userVerified: true,
        credential: {
          id: 'credential-id',
          publicKey: 'public-key',
          algorithm: 'EdDSA',
          transports: ['nfc'],
        },
        user: null!,
        authenticator: null!,
      });

      const response = await request(requestID, data);
      const result: Serialized<Authenticated> = await response.json();
      const cookies = parseSetCookie(response.headers);

      expect(result).toEqual({
        account: expect.objectContaining({
          id: expect.any(String),
          username: expect.any(String),
          families: [],
          networks: [],
        }),
      });
      expect(cookies).toEqual(expect.objectContaining({ accessToken: expect.any(String) }));
      expect(await db().$count(AccountDB, eq(AccountDB.id, result.account.id))).toBe(1);
      expect(
        await RedisPlugin.decorator.redis().hexists(AuthService.SIGNUP_CHALLENGE, cookies['signupRequestID']!),
      ).toBeFalse();
    });
  });

  describe('POST /auth/login/negotiate', () => {
    const { app } = setupIntegrationTest(AuthController);

    const request = (data: NegotiateLogin) =>
      app().handle(
        new MockRequest('/auth/login/negotiate', {
          method: 'post',
          json: data,
        }),
      );

    test('negotiate a login', async () => {
      const response = await request({});
      const result: Serialized<LoginChallenge> = await response.json();
      const cookies = parseSetCookie(response.headers);

      expect(result).toEqual({ challenge: expect.any(String) });
      expect(cookies).toEqual(expect.objectContaining({ loginRequestID: expect.any(String) }));
      expect(
        await RedisPlugin.decorator.redis().hexists(AuthService.LOGIN_CHALLENGE, cookies['loginRequestID']!),
      ).toBeTrue();
    });
  });

  describe('POST /auth/login/verify', () => {
    const { app, db } = setupIntegrationTest(AuthController);

    const request = (loginRequestID: string, data: VerifyLogin) =>
      app().handle(
        new MockRequest('/auth/login/verify', {
          method: 'post',
          json: data,
          headers: {
            cookie: new Bun.Cookie('loginRequestID', loginRequestID).serialize(),
          },
        }),
      );

    test('complete login', async () => {
      const { credential } = await createAccount(db());
      const data: VerifyLogin = {
        authentication: {
          type: 'public-key',
          id: credential.id,
          rawId: 'raw-id',
          response: {
            authenticatorData: '',
            clientDataJSON: '',
            signature: '',
          },
          clientExtensionResults: {},
        },
      };
      const { requestID } = await new AuthService(db(), RedisPlugin.decorator.redis(), ENVIRONMENT).negotiateLogin({});

      verifyAuthentication.mockResolvedValue({ userVerified: true });

      const response = await request(requestID, data);
      const result: Serialized<Authenticated> = await response.json();
      const cookies = parseSetCookie(response.headers);

      expect(result).toEqual({
        account: expect.objectContaining({
          id: expect.any(String),
          username: expect.any(String),
          families: [],
          networks: [],
        }),
      });
      expect(cookies).toEqual(expect.objectContaining({ accessToken: expect.any(String) }));
      expect(await db().$count(AccountDB, eq(AccountDB.id, result.account.id))).toBe(1);
      expect(await db().$count(AuthSessionDB, eq(AuthSessionDB.credentialID, credential.id))).toBe(1);
      expect(
        await RedisPlugin.decorator.redis().hexists(AuthService.LOGIN_CHALLENGE, cookies['loginRequestID']!),
      ).toBeFalse();
    });
  });

  describe('GET /auth/session', () => {
    const { app, db } = setupIntegrationTest(AuthController, { env: ENVIRONMENT });

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
      const { account, credential } = await createAccount(db());
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
    const { app, db } = setupIntegrationTest(AuthController, { env: ENVIRONMENT });

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
      const { credential } = await createAccount(db());
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
