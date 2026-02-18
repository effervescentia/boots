import { DatabaseGlobal } from '@api/db/db.global';
import Elysia, { type CookieOptions, NotFoundError } from 'elysia';
import { LOGIN_TTL, SIGNUP_TTL } from '../auth.const';
import { AUTH_COOKIE } from '../auth.plugin';
import {
  AuthNegotiateLoginCookie,
  AuthNegotiateSignupCookie,
  AuthVerifyLoginCookie,
  AuthVerifySignupCookie,
} from '../data/auth.cookie';
import { AuthenticatedResponse } from '../data/authenticated.res';
import { AuthSessionService } from '../session/auth-session.service';
import { AuthAndroidService } from './auth-android.service';
import { type NegotiateAndroidLogin, NegotiateAndroidLoginResponse } from './data/negotiate-android-login.res';
import { type NegotiateAndroidSignup, NegotiateAndroidSignupResponse } from './data/negotiate-android-signup.res';
import { VerifyAndroidLoginRequest } from './data/verify-android-login.req';
import { VerifyAndroidSignupRequest } from './data/verify-android-signup.req';

const ANDROID_AUTH_COOKIE: CookieOptions = {
  ...AUTH_COOKIE,
  secure: false,
};

export const AuthAndroidController = new Elysia({ prefix: '/auth/android' })
  .derive({ as: 'scoped' }, () => ({
    service: new AuthAndroidService(DatabaseGlobal.client),
    sessionService: new AuthSessionService(DatabaseGlobal.client),
  }))

  .post(
    '/signup/negotiate',
    async ({ service, cookie: { signupRequestID } }) => {
      const { registration, requestID } = await service.negotiateSignup();

      signupRequestID.set({
        ...ANDROID_AUTH_COOKIE,
        value: requestID,
        maxAge: SIGNUP_TTL * 1000,
      });

      return registration as NegotiateAndroidSignup;
    },
    {
      cookie: AuthNegotiateSignupCookie,
      response: NegotiateAndroidSignupResponse,
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
      body: VerifyAndroidSignupRequest,
      cookie: AuthVerifySignupCookie,
      response: AuthenticatedResponse,
    },
  )

  .post(
    '/login/negotiate',
    async ({ service, cookie: { loginRequestID } }) => {
      const { authentication, requestID } = await service.negotiateLogin();

      loginRequestID.set({
        ...AUTH_COOKIE,
        value: requestID,
        maxAge: LOGIN_TTL * 1000,
      });

      return authentication as NegotiateAndroidLogin;
    },
    {
      cookie: AuthNegotiateLoginCookie,
      response: NegotiateAndroidLoginResponse,
    },
  )

  .post(
    '/login/verify',
    async ({ service, sessionService, body, cookie: { loginRequestID, accessToken } }) => {
      try {
        if (!loginRequestID.value) throw new NotFoundError();

        const requestID = loginRequestID.value;
        loginRequestID.remove();

        const { account, session } = await service.verifyLogin(requestID, body);

        await sessionService.refreshAccessToken(accessToken, session.id);

        return { account };
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
    {
      body: VerifyAndroidLoginRequest,
      cookie: AuthVerifyLoginCookie,
      response: AuthenticatedResponse,
    },
  );
