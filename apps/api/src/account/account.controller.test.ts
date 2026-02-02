import { describe, expect, test } from 'bun:test';
import { AuthCredentialDB } from '@api/db/db.schema';
import { MockRequest, type Serialized, serialize } from '@bltx/test';
import { unwrap } from '@test/request.util';
import { setupIntegrationTest } from '@test/setup.util';
import { eq } from 'drizzle-orm';
import { AccountController } from './account.controller';
import { AccountDB } from './data/account.db';
import type { AccountDetails } from './data/account-details.dto';

describe('AccountController', () => {
  describe('GET /account/self', () => {
    const { app, fixture } = setupIntegrationTest(AccountController);

    const request = (accountID: string): Promise<Serialized<AccountDetails>> =>
      app()
        .handle(
          new MockRequest('/account/self', {
            method: 'get',
            headers: { 'test-principal': accountID },
          }),
        )
        .then(unwrap);

    test('get own account', async () => {
      const { account } = await fixture().createAccount();

      const result = await request(account.id);

      expect(result).toEqual(serialize(account));
    });
  });

  describe('DELETE /account/self', () => {
    const { app, db, fixture } = setupIntegrationTest(AccountController);

    const request = (accountID: string) =>
      app().handle(
        new MockRequest('/account/self', {
          method: 'delete',
          headers: { 'test-principal': accountID },
        }),
      );

    test('delete own account', async () => {
      const { account } = await fixture().createAccount();

      await request(account.id);

      expect(await db().query.AccountDB.findFirst({ where: eq(AccountDB.id, account.id) })).toEqual(
        expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      );
      expect(await db().$count(AuthCredentialDB, eq(AuthCredentialDB.accountID, account.id))).toBe(0);
    });
  });
});
