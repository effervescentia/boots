import { describe, expect, test } from 'bun:test';
import type { Environment } from '@api/app/app.env';
import { MemoDB } from '@api/db/db.schema';
import { MemoService } from '@api/memo/memo.service';
import { MockRequest, type Serialized, serialize } from '@bltx/test';
import { setupIntegrationTest } from '@test/setup.util';
import { eq } from 'drizzle-orm';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { AccountDB } from './data/account.db';
import type { AccountDetails } from './data/account-details.dto';

const ENVIRONMENT = {
  ACCOUNT_MAX_ALIASES: 3,
  ACCOUNT_ALIAS_EXPIRY_SHORT: 1000,
  ACCOUNT_ALIAS_EXPIRY_LONG: 1000,
} as Environment;

describe('AccountController', () => {
  describe('POST /account', () => {
    const { app, db } = setupIntegrationTest(AccountController);

    const request = (): Promise<Serialized<AccountDetails>> =>
      app()
        .handle(new MockRequest('/account', { method: 'post' }))
        .then((res) => res.json());

    test('create account with unique username', async () => {
      const result = await request();

      expect(result).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          username: expect.any(String),
          isChild: false,
        }),
      );

      expect(serialize(await db().query.AccountDB.findFirst({ where: eq(AccountDB.id, result.id) }))).toEqual(result);
    });
  });

  describe('GET /account/:accountID', () => {
    const { app, db } = setupIntegrationTest(AccountController);

    const request = (accountID: string): Promise<Serialized<AccountDetails>> =>
      app()
        .handle(new MockRequest(`/account/${accountID}`, { method: 'get' }))
        .then((res) => res.json());

    test('get account', async () => {
      const account = await new AccountService(db(), null!).create();

      const result = await request(account.id);

      expect(result).toEqual(serialize(account));
    });
  });

  describe('DELETE /account/:accountID', () => {
    const { app, db } = setupIntegrationTest(AccountController);

    const request = (accountID: string) => app().handle(new MockRequest(`/account/${accountID}`, { method: 'delete' }));

    test('delete account', async () => {
      const account = await new AccountService(db(), ENVIRONMENT).create();
      await new MemoService(db()).createText(account.id, { geolocation: [0, 0], content: 'my memo' });

      await request(account.id);

      expect(await db().$count(AccountDB, eq(AccountDB.id, account.id))).toBe(0);
      expect(await db().$count(MemoDB, eq(MemoDB.authorID, account.id))).toBe(0);
    });
  });
});
