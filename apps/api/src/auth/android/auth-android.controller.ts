import { DatabaseGlobal } from '@api/db/db.global';
import Elysia, { NotFoundError, t } from 'elysia';
import { LOGIN_TTL, SIGNUP_TTL } from '../auth.const';
import { AUTH_COOKIE } from '../auth.plugin';
import { AuthenticatedResponse } from '../data/authenticated.res';
import { VerifyPasskeySignupRequest } from '../data/verify-passkey-signup.req';
import { AuthSessionService } from '../session/auth-session.service';
import { AuthAndroidService } from './auth-android.service';
import { AndroidChallengeResponse } from './data/android-challenge.res';

export const AuthAndroidController = new Elysia({ prefix: '/auth/android' })
  .derive({ as: 'scoped' }, () => ({
    service: new AuthAndroidService(DatabaseGlobal.client),
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
      response: AndroidChallengeResponse,
    },
  )

  .post(
    '/signup/verify',
    async ({ service, sessionService, body, cookie: { signupRequestID, accessToken } }) => {
      try {
        const requestID = signupRequestID.value;
        if (!requestID) throw new NotFoundError();
        signupRequestID.remove();

        const { account, session } = await service.verifySignup(requestID, body);

        await sessionService.refreshAccessToken(accessToken, session.id);

        return { account };
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
    {
      body: VerifyPasskeySignupRequest,
      cookie: t.Cookie({
        signupRequestID: t.Optional(t.String()),
        accessToken: t.Optional(t.String()),
      }),
      response: AuthenticatedResponse,
    },
  );

// .post(
//   '/login/negotiate',
//   async ({ service, body, cookie: { loginRequestID } }) => {
//     const { challenge, requestID } = await service.negotiateLogin(body);

//     loginRequestID.set({
//       ...AUTH_COOKIE,
//       value: requestID,
//       maxAge: LOGIN_TTL * 1000,
//     });

//     return { challenge };
//   },
//   {
//     body: NegotiateWebLoginRequest,
//     cookie: t.Cookie({
//       loginRequestID: t.Optional(t.String()),
//     }),
//     response: LoginChallengeResponse,
//   },
// )

// .post(
//   '/login/verify',
//   async ({ service, sessionService, body, cookie: { loginRequestID, accessToken } }) => {
//     if (!loginRequestID.value) throw new NotFoundError();

//     const requestID = loginRequestID.value;
//     loginRequestID.remove();

//     const { account, session } = await service.verifyLogin(requestID, body);

//     await sessionService.refreshAccessToken(accessToken, session.id);

//     return { account };
//   },
//   {
//     body: VerifyWebLoginRequest,
//     cookie: t.Cookie({
//       loginRequestID: t.Optional(t.String()),
//       accessToken: t.Optional(t.String()),
//     }),
//     response: AuthenticatedResponse,
//   },
// );
