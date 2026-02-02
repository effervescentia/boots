import type { Account } from '@api/account/data/account.dto';
import { DatabaseGlobal } from '@api/db/db.global';
import { eq } from 'drizzle-orm';
import Elysia, { type CookieOptions, t } from 'elysia';
import { ACCESS_TOKEN_TTL } from './auth.const';
import { AuthSessionDB } from './data/auth-session.db';
import { AuthSessionService } from './session/auth-session.service';

export const AUTH_COOKIE: CookieOptions = {
  domain: 'api.boots.localhost',
  sameSite: true,
  httpOnly: true,
  secure: true,
};

export const AuthPlugin = new Elysia({ name: 'plugin.auth' })
  .guard({ as: 'scoped', cookie: t.Cookie({ accessToken: t.Optional(t.String()) }) })
  .macro({
    authenticated: {
      resolve: async ({ headers, cookie: { accessToken }, status }) => {
        if (import.meta.env.NODE_ENV === 'test') {
          if (!headers['test-principal']) return status(401);

          return {
            principal: { id: headers['test-principal'] } as Account,
          };
        }

        const sessionService = new AuthSessionService(DatabaseGlobal.client);
        try {
          if (typeof accessToken.value !== 'string') return status(401);

          const tokenData = await sessionService.accessToken.verify(accessToken.value);
          if (!tokenData) return status(401);

          const session = await DatabaseGlobal.client.query.AuthSessionDB.findFirst({
            where: eq(AuthSessionDB.id, tokenData.sessionID),
            with: { credential: { with: { account: true }, columns: {} } },
            columns: {},
          });
          if (!session) return status(401);

          accessToken.set({
            ...AUTH_COOKIE,
            value: await sessionService.accessToken.sign({ sessionID: tokenData.sessionID }),
            maxAge: ACCESS_TOKEN_TTL * 1000,
          });

          return { principal: session.credential.account };
        } catch (err) {
          accessToken?.remove();
          throw err;
        }
      },
    },
  });
