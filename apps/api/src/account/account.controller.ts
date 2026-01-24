import { DatabasePlugin } from '@api/db/db.plugin';
import { EnvironmentPlugin } from '@api/global/environment.plugin';
import Elysia, { NotFoundError, t } from 'elysia';
import { AccountService } from './account.service';
import { AccountDTO } from './data/account.dto';
import { AccountDetailsDTO } from './data/account-details.dto';

const AccountParams = t.Object({ accountID: t.String({ format: 'uuid' }) });

export const AccountController = new Elysia({ prefix: '/account' })
  .use(DatabasePlugin)
  .use(EnvironmentPlugin)
  .derive({ as: 'scoped' }, ({ db, env }) => ({
    service: new AccountService(db(), env()),
  }))

  .get(
    '/',
    async ({ db }) => {
      return db().query.AccountDB.findMany();
    },
    {
      response: t.Array(AccountDTO),
    },
  )

  .post(
    '/',
    async ({ service }) => {
      return service.create();
    },
    {
      // body: CreateAccountRequest,
      response: AccountDetailsDTO,
    },
  )

  .get(
    '/:accountID',
    async ({ service, params }) => {
      const account = await service.getDetails(params.accountID);
      if (!account) throw new NotFoundError(`No Account exists with ID '${params.accountID}'`);

      return account;
    },
    {
      params: AccountParams,
      response: AccountDetailsDTO,
    },
  )

  .delete(
    '/:accountID',
    async ({ service, params }) => {
      await service.delete(params.accountID);
    },
    {
      params: AccountParams,
    },
  );
