import { DatabaseGlobal } from '@api/db/db.global';
import Elysia, { NotFoundError, t } from 'elysia';
import { LOGIN_TTL, SIGNUP_TTL } from '../auth.const';
import { AUTH_COOKIE } from '../auth.plugin';
import { AuthenticatedResponse } from '../data/authenticated.res';
import { AuthSessionService } from '../session/auth-session.service';
import { AuthWebService } from './auth-web.service';
import { VerifyWebLoginRequest } from './data/verify-web-login.req';
import { VerifyWebSignupRequest } from './data/verify-web-signup.req';
import { WebChallengeResponse } from './data/web-challenge.res';

export const AuthWebController = new Elysia({ prefix: '/auth/web' })
  .derive({ as: 'scoped' }, () => ({
    service: new AuthWebService(DatabaseGlobal.client),
    sessionService: new AuthSessionService(DatabaseGlobal.client),
  }))

  .post(
    '/signup/negotiate',
    async ({ service, cookie: { signupRequestID } }) => {
      const { challenge, requestID } = await service.negotiateSignup();

      signupRequestID.set({
        ...AUTH_COOKIE,
        value: requestID,
        maxAge: SIGNUP_TTL * 1000,
      });

      return { challenge };
    },
    {
      cookie: t.Object({ signupRequestID: t.Optional(t.String()) }),
      response: WebChallengeResponse,
    },
  )

  .post(
    '/signup/verify',
    async ({ service, sessionService, body, cookie: { signupRequestID, accessToken } }) => {
      const requestID = signupRequestID.value;
      if (!requestID) throw new NotFoundError();
      signupRequestID.remove();

      const { account, session } = await service.verifySignup(requestID, body);

      await sessionService.refreshAccessToken(accessToken, session.id);

      return { account };
    },
    {
      body: VerifyWebSignupRequest,
      cookie: t.Cookie({
        signupRequestID: t.Optional(t.String()),
        accessToken: t.Optional(t.String()),
      }),
      response: AuthenticatedResponse,
    },
  )

  .post(
    '/login/negotiate',
    async ({ service, cookie: { loginRequestID } }) => {
      const { challenge, requestID } = await service.negotiateLogin();

      loginRequestID.set({
        ...AUTH_COOKIE,
        value: requestID,
        maxAge: LOGIN_TTL * 1000,
      });

      return { challenge };
    },
    {
      cookie: t.Cookie({
        loginRequestID: t.Optional(t.String()),
      }),
      response: WebChallengeResponse,
    },
  )

  .post(
    '/login/verify',
    async ({ service, sessionService, body, cookie: { loginRequestID, accessToken } }) => {
      if (!loginRequestID.value) throw new NotFoundError();

      const requestID = loginRequestID.value;
      loginRequestID.remove();

      const { account, session } = await service.verifyLogin(requestID, body);

      await sessionService.refreshAccessToken(accessToken, session.id);

      return { account };
    },
    {
      body: VerifyWebLoginRequest,
      cookie: t.Cookie({
        loginRequestID: t.Optional(t.String()),
        accessToken: t.Optional(t.String()),
      }),
      response: AuthenticatedResponse,
    },
  );
