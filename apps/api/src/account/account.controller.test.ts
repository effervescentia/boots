import { describe, expect, test } from 'bun:test';
import { AuthAlgorithm } from '@api/auth/data/auth-algorithm.enum';
import { AuthTransport } from '@api/auth/data/auth-transport.enum';
import { AuthCredentialDB } from '@api/db/db.schema';
import type { DB } from '@api/db/db.types';
import { MockRequest, type Serialized, serialize } from '@bltx/test';
import { setupIntegrationTest } from '@test/setup.util';
import { eq } from 'drizzle-orm';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { AccountDB } from './data/account.db';
import type { AccountDetails } from './data/account-details.dto';

describe('AccountController', () => {
  const createAccount = (db: DB) => {
    return new AccountService(db).create({
      id: 'credential-id',
      publicKey: 'public-key',
      algorithm: AuthAlgorithm.EdDSA,
      transports: [AuthTransport.NFC],
    });
  };

  describe('GET /account/self', () => {
    const { app, db } = setupIntegrationTest(AccountController);

    const request = (accountID: string): Promise<Serialized<AccountDetails>> =>
      app()
        .handle(
          new MockRequest('/account/self', {
            method: 'get',
            headers: { 'test-principal': accountID },
          }),
        )
        .then((res) => res.json());

    test('get own account', async () => {
      const { account } = await createAccount(db());

      const result = await request(account.id);

      expect(result).toEqual(serialize(account));
    });
  });

  describe('DELETE /account/self', () => {
    const { app, db } = setupIntegrationTest(AccountController);

    const request = (accountID: string) =>
      app().handle(
        new MockRequest('/account/self', {
          method: 'delete',
          headers: { 'test-principal': accountID },
        }),
      );

    test('delete own account', async () => {
      const { account } = await createAccount(db());

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
