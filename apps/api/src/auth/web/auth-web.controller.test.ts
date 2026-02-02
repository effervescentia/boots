import { describe, expect, mock, test } from 'bun:test';
import { AccountDB } from '@api/account/data/account.db';
import type { Environment } from '@api/app/app.env';
import { RedisPlugin } from '@api/redis/redis.plugin';
import { MockRequest, type Serialized } from '@bltx/test';
import { parseSetCookie } from '@test/cookie.util';
import { setupIntegrationTest } from '@test/setup.util';
import { eq } from 'drizzle-orm';
import { AuthSessionDB } from '../data/auth-session.db';
import type { Authenticated } from '../data/authenticated.res';
import type { VerifyPasskeySignup } from '../data/verify-passkey-signup.req';
import { AuthSessionController } from '../session/auth-session.controller';
import { AuthWebService } from './auth-web.service';
import type { NegotiateWebLogin } from './data/negotiate-web-login.req';
import type { VerifyWebLogin } from './data/verify-web-login.req';
import type { WebChallenge } from './data/web-challenge.res';

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

describe('AuthWebController', () => {
  describe('POST /auth/web/signup/negotiate', () => {
    const { app } = setupIntegrationTest(AuthSessionController);

    const request = () => app().handle(new MockRequest('/auth/web/signup/negotiate', { method: 'post' }));

    test('negotiate a signup', async () => {
      const response = await request();
      const result: Serialized<WebChallenge> = await response.json();
      const cookies = parseSetCookie(response.headers);

      expect(result).toEqual({ challenge: expect.any(String) });
      expect(cookies).toEqual(expect.objectContaining({ signupRequestID: expect.any(String) }));
      expect(
        await RedisPlugin.decorator
          .redis()
          .client.hexists(AuthWebService.SIGNUP_CHALLENGE, cookies['signupRequestID']!),
      ).toBeTrue();
    });
  });

  describe('POST /auth/web/signup/verify', () => {
    const { app, db } = setupIntegrationTest(AuthSessionController);

    const request = (signupRequestID: string, data: VerifyPasskeySignup) =>
      app().handle(
        new MockRequest('/auth/web/signup/verify', {
          method: 'post',
          json: data,
          headers: {
            cookie: new Bun.Cookie('signupRequestID', signupRequestID).serialize(),
          },
        }),
      );

    test('complete signup', async () => {
      const data: VerifyPasskeySignup = {
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
      const { requestID } = await new AuthWebService(
        db(),
        RedisPlugin.decorator.redis(),
        ENVIRONMENT,
      ).negotiateSignup();

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
        await RedisPlugin.decorator
          .redis()
          .client.hexists(AuthWebService.SIGNUP_CHALLENGE, cookies['signupRequestID']!),
      ).toBeFalse();
    });
  });

  describe('POST /auth/web/login/negotiate', () => {
    const { app } = setupIntegrationTest(AuthSessionController);

    const request = (data: NegotiateWebLogin) =>
      app().handle(
        new MockRequest('/auth/web/login/negotiate', {
          method: 'post',
          json: data,
        }),
      );

    test('negotiate a login', async () => {
      const response = await request({});
      const result: Serialized<WebChallenge> = await response.json();
      const cookies = parseSetCookie(response.headers);

      expect(result).toEqual({ challenge: expect.any(String) });
      expect(cookies).toEqual(expect.objectContaining({ loginRequestID: expect.any(String) }));
      expect(
        await RedisPlugin.decorator.redis().client.hexists(AuthWebService.LOGIN_CHALLENGE, cookies['loginRequestID']!),
      ).toBeTrue();
    });
  });

  describe('POST /auth/web/login/verify', () => {
    const { app, db, fixture } = setupIntegrationTest(AuthSessionController);

    const request = (loginRequestID: string, data: VerifyWebLogin) =>
      app().handle(
        new MockRequest('/auth/web/login/verify', {
          method: 'post',
          json: data,
          headers: {
            cookie: new Bun.Cookie('loginRequestID', loginRequestID).serialize(),
          },
        }),
      );

    test('complete login', async () => {
      const { credential } = await fixture().createAccount();
      const data: VerifyWebLogin = {
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
      const { requestID } = await new AuthWebService(db(), RedisPlugin.decorator.redis(), ENVIRONMENT).negotiateLogin(
        {},
      );

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
        await RedisPlugin.decorator.redis().client.hexists(AuthWebService.LOGIN_CHALLENGE, cookies['loginRequestID']!),
      ).toBeFalse();
    });
  });
});
