import { describe, expect, test } from 'bun:test';
import { AccountService } from '@api/account/account.service';
import { AuthAlgorithm } from '@api/auth/data/auth-algorithm.enum';
import { AuthTransport } from '@api/auth/data/auth-transport.enum';
import type { DB } from '@api/db/db.types';
import { insertOne, updateOne } from '@bltx/db';
import { MockRequest, type Serialized, serialize } from '@bltx/test';
import { setupIntegrationTest } from '@test/setup.util';
import { and, eq } from 'drizzle-orm';
import type { CreateFamily } from './data/create-family.req';
import { FamilyDB } from './data/family.db';
import type { Family } from './data/family.dto';
import { FamilyMemberDB } from './data/family-member.db';
import { FamilyRole } from './data/family-role.enum';
import type { PatchFamily } from './data/patch-family.req';
import { FamilyController } from './family.controller';
import { FamilyService } from './family.service';

describe('FamilyController', () => {
  const createAccount = (db: DB) => {
    return new AccountService(db).create({
      id: Bun.randomUUIDv7(),
      publicKey: 'public-key',
      algorithm: AuthAlgorithm.EdDSA,
      transports: [AuthTransport.NFC],
    });
  };

  const createFamily = (db: DB, accountID: string, { name = 'My Family', ...data }: Partial<CreateFamily> = {}) => {
    return new FamilyService(db).create(accountID, { name, ...data });
  };

  const createFamilyMember = async (db: DB, familyID: string) => {
    const { account } = await createAccount(db);
    await insertOne(db, FamilyMemberDB, { familyID, accountID: account.id, role: FamilyRole.ADULT });
    return { account };
  };

  describe('POST /family', () => {
    const { app, db } = setupIntegrationTest(FamilyController);

    const request = (accountID: string, data: CreateFamily): Promise<Serialized<Family>> =>
      app()
        .handle(
          new MockRequest('/family', {
            method: 'post',
            json: data,
            headers: { 'test-principal': accountID },
          }),
        )
        .then((res) => res.json());

    test('create a new family', async () => {
      const data = { name: 'My Family' };
      const { account } = await createAccount(db());

      const result = await request(account.id, data);

      expect(result).toEqual(expect.objectContaining({ ...data, id: expect.any(String) }));

      expect(serialize(await db().query.FamilyDB.findFirst({ where: eq(FamilyDB.id, result.id) }))).toEqual(result);
      expect(
        await db().query.FamilyMemberDB.findFirst({
          where: and(eq(FamilyMemberDB.familyID, result.id), eq(FamilyMemberDB.accountID, account.id)),
        }),
      ).toEqual(
        expect.objectContaining({
          familyID: result.id,
          accountID: account.id,
          role: FamilyRole.ADULT,
        }),
      );
    });
  });

  describe('GET /family/:familyID', () => {
    const { app, db } = setupIntegrationTest(FamilyController);

    const request = (accountID: string, familyID: string): Promise<Serialized<Family>> =>
      app()
        .handle(
          new MockRequest(`/family/${familyID}`, {
            method: 'get',
            headers: { 'test-principal': accountID },
          }),
        )
        .then(async (res) => {
          if (res.ok) return res.json();

          throw new Error(await res.text());
        });

    test('get family details', async () => {
      const { account } = await createAccount(db());
      const family = await createFamily(db(), account.id);

      const result = await request(account.id, family.id);

      expect(result).toEqual(serialize(family));
    });

    test('reject non-members', async () => {
      const { account: memberAccount } = await createAccount(db());
      const { account: nonMemberAccount } = await createAccount(db());
      const family = await createFamily(db(), memberAccount.id);

      expect(() => request(nonMemberAccount.id, family.id)).toThrowError(`No Family exists with ID '${family.id}`);
    });
  });

  describe('PATCH /family/:familyID', () => {
    const { app, db } = setupIntegrationTest(FamilyController);

    const request = (accountID: string, familyID: string, data: PatchFamily): Promise<Serialized<Family>> =>
      app()
        .handle(
          new MockRequest(`/family/${familyID}`, {
            method: 'patch',
            json: data,
            headers: { 'test-principal': accountID },
          }),
        )
        .then(async (res) => {
          if (res.ok) return res.json();

          throw new Error(await res.text());
        });

    test('update family details', async () => {
      const data = { name: 'The Tans' };
      const { account } = await createAccount(db());
      const family = await createFamily(db(), account.id);

      const result = await request(account.id, family.id, data);

      expect(result).toEqual(expect.objectContaining(data));
    });

    test('reject non-members', async () => {
      const data = { name: 'The Tans' };
      const { account: memberAccount } = await createAccount(db());
      const { account: nonMemberAccount } = await createAccount(db());
      const family = await createFamily(db(), memberAccount.id);

      expect(() => request(nonMemberAccount.id, family.id, data)).toThrowError(
        `No Family exists with ID '${family.id}`,
      );
    });

    test('reject children', async () => {
      const data = { name: 'The Tans' };
      const { account } = await createAccount(db());
      const family = await createFamily(db(), account.id);
      await updateOne(db(), FamilyMemberDB, eq(FamilyMemberDB.accountID, account.id), { role: FamilyRole.CHILD });

      expect(() => request(account.id, family.id, data)).toThrowError('Only adults can update Family details');
    });
  });

  describe('DELETE /family/:familyID', () => {
    const { app, db } = setupIntegrationTest(FamilyController);

    const request = (accountID: string, familyID: string) =>
      app()
        .handle(
          new MockRequest(`/family/${familyID}`, {
            method: 'delete',
            headers: { 'test-principal': accountID },
          }),
        )
        .then(async (res) => {
          if (!res.ok) throw new Error(await res.text());
        });

    test('delete family', async () => {
      const { account } = await createAccount(db());
      const family = await createFamily(db(), account.id);

      await request(account.id, family.id);

      expect(await db().$count(FamilyDB, eq(FamilyDB.id, family.id))).toBe(0);
    });

    test('reject non-members', async () => {
      const { account: memberAccount } = await createAccount(db());
      const { account: nonMemberAccount } = await createAccount(db());
      const family = await createFamily(db(), memberAccount.id);

      expect(() => request(nonMemberAccount.id, family.id)).toThrowError(`No Family exists with ID '${family.id}`);
    });

    test('reject children', async () => {
      const { account } = await createAccount(db());
      const family = await createFamily(db(), account.id);
      await updateOne(db(), FamilyMemberDB, eq(FamilyMemberDB.accountID, account.id), { role: FamilyRole.CHILD });

      expect(() => request(account.id, family.id)).toThrowError('Only adults can delete a Family');
    });
  });

  describe('DELETE /family/:familyID/membership', () => {
    const { app, db } = setupIntegrationTest(FamilyController);

    const request = (accountID: string, familyID: string) =>
      app()
        .handle(
          new MockRequest(`/family/${familyID}/membership`, {
            method: 'delete',
            headers: { 'test-principal': accountID },
          }),
        )
        .then(async (res) => {
          if (!res.ok) throw new Error(await res.text());
        });

    test('delete family membership', async () => {
      const { account } = await createAccount(db());
      const family = await createFamily(db(), account.id);
      await createFamilyMember(db(), family.id);

      await request(account.id, family.id);

      expect(await db().$count(FamilyMemberDB, eq(FamilyMemberDB.familyID, family.id))).toBe(1);
    });

    test('clean up family if all members are deleted', async () => {
      const { account } = await createAccount(db());
      const family = await createFamily(db(), account.id);

      await request(account.id, family.id);

      expect(await db().$count(FamilyMemberDB, eq(FamilyMemberDB.familyID, family.id))).toBe(0);
      expect(await db().$count(FamilyDB, eq(FamilyDB.id, family.id))).toBe(0);
    });
  });

  describe('DELETE /family/:familyID/member/:accountID', () => {
    const { app, db } = setupIntegrationTest(FamilyController);

    const request = (principalID: string, familyID: string, memberID: string) =>
      app()
        .handle(
          new MockRequest(`/family/${familyID}/member/${memberID}`, {
            method: 'delete',
            headers: { 'test-principal': principalID },
          }),
        )
        .then(async (res) => {
          if (!res.ok) throw new Error(await res.text());
        });

    test('delete family member', async () => {
      const { account } = await createAccount(db());
      const family = await createFamily(db(), account.id);
      const { account: familyMember } = await createFamilyMember(db(), family.id);

      await request(account.id, family.id, familyMember.id);

      expect(await db().$count(FamilyMemberDB, eq(FamilyMemberDB.familyID, family.id))).toBe(1);
    });

    test('clean up family if all members are deleted', async () => {
      const { account } = await createAccount(db());
      const family = await createFamily(db(), account.id);

      await request(account.id, family.id, account.id);

      expect(await db().$count(FamilyMemberDB, eq(FamilyMemberDB.familyID, family.id))).toBe(0);
      expect(await db().$count(FamilyDB, eq(FamilyDB.id, family.id))).toBe(0);
    });

    test('reject non-members', async () => {
      const { account: memberAccount } = await createAccount(db());
      const { account: nonMemberAccount } = await createAccount(db());
      const family = await createFamily(db(), memberAccount.id);
      const { account: familyMember } = await createFamilyMember(db(), family.id);

      expect(() => request(nonMemberAccount.id, family.id, familyMember.id)).toThrowError(
        `No Family exists with ID '${family.id}`,
      );
    });

    test('reject children', async () => {
      const { account } = await createAccount(db());
      const family = await createFamily(db(), account.id);
      const { account: familyMember } = await createFamilyMember(db(), family.id);
      await updateOne(db(), FamilyMemberDB, eq(FamilyMemberDB.accountID, account.id), {
        role: FamilyRole.CHILD,
      });

      expect(() => request(account.id, family.id, familyMember.id)).toThrowError(
        'Only adults can remove other Family members',
      );
    });
  });
});
