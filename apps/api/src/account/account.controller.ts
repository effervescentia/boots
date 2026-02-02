import { AuthPlugin } from '@api/auth/auth.plugin';
import { DatabaseGlobal } from '@api/db/db.global';
import Elysia, { InternalServerError } from 'elysia';
import { AccountService } from './account.service';
import { AccountDetailsDTO } from './data/account-details.dto';

export const AccountController = new Elysia({ prefix: '/account' })
  .use(AuthPlugin)
  .derive({ as: 'scoped' }, () => ({ service: new AccountService(DatabaseGlobal.client) }))

  .get(
    '/self',
    async ({ service, principal }) => {
      const account = await service.getDetails(principal.id);
      if (!account) throw new InternalServerError('Account not found');

      return account;
    },
    {
      authenticated: true,
      response: AccountDetailsDTO,
    },
  )

  .delete(
    '/self',
    async ({ service, principal }) => {
      await service.delete(principal.id);
    },
    {
      authenticated: true,
    },
  );
