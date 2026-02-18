import { t } from 'elysia';

export const AuthNegotiateSignupCookie = t.Cookie({
  signupRequestID: t.Optional(t.String()),
});

export const AuthVerifySignupCookie = t.Cookie({
  signupRequestID: t.Optional(t.String()),
  accessToken: t.Optional(t.String()),
});

export const AuthNegotiateLoginCookie = t.Cookie({
  loginRequestID: t.Optional(t.String()),
});

export const AuthVerifyLoginCookie = t.Cookie({
  loginRequestID: t.Optional(t.String()),
  accessToken: t.Optional(t.String()),
});
