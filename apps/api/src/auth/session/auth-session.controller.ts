import { AccountService } from '@api/account/account.service';
import { DatabaseGlobal } from '@api/db/db.global';
import { EnvironmentPlugin } from '@api/global/environment.plugin';
import Elysia, { NotFoundError, t } from 'elysia';
import { AuthenticatedResponse } from '../data/authenticated.res';
import { AuthSessionService } from './auth-session.service';

export const AuthSessionController = new Elysia({ prefix: '/session' })
  .use(EnvironmentPlugin)
  .derive({ as: 'scoped' }, ({ env }) => ({
    service: new AuthSessionService(DatabaseGlobal.client, env()),
    accountService: new AccountService(DatabaseGlobal.client),
  }))

  .get(
    '/',
    async ({ service, accountService, cookie: { accessToken } }) => {
      const tokenData = await service.accessToken.verify(accessToken.value);
      if (!tokenData) throw new NotFoundError();

      const session = await service.get(tokenData.sessionID);
      if (!session) throw new NotFoundError();

      const account = await accountService.getDetails(session.credential.accountID);
      if (!account) throw new NotFoundError();

      await service.refreshAccessToken(accessToken, session.id);

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
    '/',
    async ({ service, cookie: { accessToken } }) => {
      const tokenString = accessToken.value;
      accessToken.remove();

      const tokenData = await service.accessToken.verify(tokenString);
      if (!tokenData) return;

      await service.delete(tokenData.sessionID);
    },
    {
      cookie: t.Cookie({
        accessToken: t.String(),
      }),
    },
  );
