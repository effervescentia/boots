import { AccountService } from '@api/account/account.service';
import { DatabasePlugin } from '@api/db/db.plugin';
import { EnvironmentPlugin } from '@api/global/environment.plugin';
import { RedisPlugin } from '@api/redis/redis.plugin';
import Elysia, { Cookie, NotFoundError, t } from 'elysia';
import { ACCESS_TOKEN_TTL, LOGIN_TTL, SIGNUP_TTL } from './auth.const';
import { AUTH_COOKIE } from './auth.plugin';
import { AuthService } from './auth.service';
import { AuthSessionService } from './auth-session.service';
import { AuthenticatedResponse } from './data/authenticated.res';
import { LoginChallengeResponse } from './data/login-challenge.res';
import { NegotiateLoginRequest } from './data/negotiate-login.req';
import { NegotiateSignupRequest } from './data/negotiate-signup.req';
import { SignupChallengeResponse } from './data/signup-challenge.res';
import { VerifyLoginRequest } from './data/verify-login.req';
import { VerifySignupRequest } from './data/verify-signup.req';

export const AuthController = new Elysia({ prefix: '/auth' })
  .use(DatabasePlugin)
  .use(RedisPlugin)
  .use(EnvironmentPlugin)
  .derive({ as: 'scoped' }, ({ db, redis, env }) => {
    const sessionService = new AuthSessionService(db(), env());

    return {
      service: new AuthService(db(), redis(), env()),
      accountService: new AccountService(db()),
      sessionService,

      refreshAccessToken: async (accessToken: Cookie<string | undefined>, sessionID: number) =>
        accessToken.set({
          ...AUTH_COOKIE,
          value: await sessionService.accessToken.sign({ sessionID }),
          maxAge: ACCESS_TOKEN_TTL * 1000,
        }),
    };
  })

  .post(
    '/signup/negotiate',
    async ({ service, body, cookie: { signupRequestID } }) => {
      const { challenge, requestID } = await service.negotiateSignup(body);

      signupRequestID.set({
        ...AUTH_COOKIE,
        value: requestID,
        maxAge: SIGNUP_TTL * 1000,
      });

      return { challenge };
    },
    {
      body: NegotiateSignupRequest,
      cookie: t.Object({ signupRequestID: t.Optional(t.String()) }),
      response: SignupChallengeResponse,
    },
  )

  .post(
    '/signup/verify',
    async ({ service, body, cookie: { signupRequestID, accessToken }, refreshAccessToken }) => {
      try {
        const requestID = signupRequestID.value;
        if (!requestID) throw new NotFoundError();
        signupRequestID.remove();

        const { account, session } = await service.verifySignup(requestID, body);

        await refreshAccessToken(accessToken, session.id);

        return { account };
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
    {
      body: VerifySignupRequest,
      cookie: t.Cookie({
        signupRequestID: t.Optional(t.String()),
        accessToken: t.Optional(t.String()),
      }),
      response: AuthenticatedResponse,
    },
  )

  .post(
    '/login/negotiate',
    async ({ service, body, cookie: { loginRequestID } }) => {
      const { challenge, requestID } = await service.negotiateLogin(body);

      loginRequestID.set({
        ...AUTH_COOKIE,
        value: requestID,
        maxAge: LOGIN_TTL * 1000,
      });

      return { challenge };
    },
    {
      body: NegotiateLoginRequest,
      cookie: t.Cookie({
        loginRequestID: t.Optional(t.String()),
      }),
      response: LoginChallengeResponse,
    },
  )

  .post(
    '/login/verify',
    async ({ service, body, cookie: { loginRequestID, accessToken }, refreshAccessToken }) => {
      if (!loginRequestID.value) throw new NotFoundError();

      const requestID = loginRequestID.value;
      loginRequestID.remove();

      const { account, session } = await service.verifyLogin(requestID, body);

      await refreshAccessToken(accessToken, session.id);

      return { account };
    },
    {
      body: VerifyLoginRequest,
      cookie: t.Cookie({
        loginRequestID: t.Optional(t.String()),
        accessToken: t.Optional(t.String()),
      }),
      response: AuthenticatedResponse,
    },
  )

  .get(
    '/session',
    async ({ accountService, sessionService, cookie: { accessToken }, refreshAccessToken }) => {
      const tokenData = await sessionService.accessToken.verify(accessToken.value);
      if (!tokenData) throw new NotFoundError();

      const session = await sessionService.get(tokenData.sessionID);
      if (!session) throw new NotFoundError();

      const account = await accountService.getDetails(session.credential.accountID);
      if (!account) throw new NotFoundError();

      await refreshAccessToken(accessToken, session.id);

      return { account };
    },
    {
      cookie: t.Cookie({
        accessToken: t.String(),
      }),
      response: AuthenticatedResponse,
    },
  )

  .delete(
    '/session',
    async ({ sessionService, cookie: { accessToken } }) => {
      const tokenString = accessToken.value;
      accessToken.remove();

      const tokenData = await sessionService.accessToken.verify(tokenString);
      if (!tokenData) return;

      await sessionService.delete(tokenData.sessionID);
    },
    {
      cookie: t.Cookie({
        accessToken: t.String(),
      }),
    },
  );
