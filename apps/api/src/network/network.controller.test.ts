import { describe, expect, test } from 'bun:test';
import { AccountService } from '@api/account/account.service';
import { AuthAlgorithm } from '@api/auth/data/auth-algorithm.enum';
import { AuthTransport } from '@api/auth/data/auth-transport.enum';
import type { DB } from '@api/db/db.types';
import { NetworkRole } from '@api/lib';
import { insertOne, updateOne } from '@bltx/db';
import { MockRequest, type Serialized, serialize } from '@bltx/test';
import { setupIntegrationTest } from '@test/setup.util';
import { and, eq } from 'drizzle-orm';
import type { CreateNetwork } from './data/create-network.req';
import { NetworkDB } from './data/network.db';
import type { Network } from './data/network.dto';
import { NetworkMemberDB } from './data/network-member.db';
import type { PatchNetwork } from './data/patch-network.req';
import { NetworkController } from './network.controller';
import { NetworkService } from './network.service';

describe('NetworkController', () => {
  const createAccount = (db: DB) => {
    return new AccountService(db).create({
      id: Bun.randomUUIDv7(),
      publicKey: 'public-key',
      algorithm: AuthAlgorithm.EdDSA,
      transports: [AuthTransport.NFC],
    });
  };

  const createNetwork = (db: DB, accountID: string, { name = 'My Network', ...data }: Partial<CreateNetwork> = {}) => {
    return new NetworkService(db).create(accountID, { name, ...data });
  };

  const createNetworkMember = async (db: DB, networkID: string, role?: NetworkRole) => {
    const { account } = await createAccount(db);
    await insertOne(db, NetworkMemberDB, { networkID, role, accountID: account.id });
    return { account };
  };

  describe('POST /network', () => {
    const { app, db } = setupIntegrationTest(NetworkController);

    const request = (accountID: string, data: CreateNetwork): Promise<Serialized<Network>> =>
      app()
        .handle(
          new MockRequest('/network', {
            method: 'post',
            json: data,
            headers: { 'test-principal': accountID },
          }),
        )
        .then((res) => res.json());

    test('create a new network', async () => {
      const data = { name: 'My Network' };
      const { account } = await createAccount(db());

      const result = await request(account.id, data);

      expect(result).toEqual(expect.objectContaining({ ...data, id: expect.any(String) }));

      expect(serialize(await db().query.NetworkDB.findFirst({ where: eq(NetworkDB.id, result.id) }))).toEqual(result);
      expect(
        await db().query.NetworkMemberDB.findFirst({
          where: and(eq(NetworkMemberDB.networkID, result.id), eq(NetworkMemberDB.accountID, account.id)),
        }),
      ).toEqual(
        expect.objectContaining({
          networkID: result.id,
          accountID: account.id,
          role: null,
        }),
      );
    });
  });

  describe('GET /network/:networkID', () => {
    const { app, db } = setupIntegrationTest(NetworkController);

    const request = (accountID: string, networkID: string): Promise<Serialized<Network>> =>
      app()
        .handle(
          new MockRequest(`/network/${networkID}`, {
            method: 'get',
            headers: { 'test-principal': accountID },
          }),
        )
        .then(async (res) => {
          if (res.ok) return res.json();

          throw new Error(await res.text());
        });

    test('get network details', async () => {
      const { account } = await createAccount(db());
      const network = await createNetwork(db(), account.id);

      const result = await request(account.id, network.id);

      expect(result).toEqual(serialize(network));
    });

    test('reject non-members', async () => {
      const { account: memberAccount } = await createAccount(db());
      const { account: nonMemberAccount } = await createAccount(db());
      const network = await createNetwork(db(), memberAccount.id);

      expect(() => request(nonMemberAccount.id, network.id)).toThrowError(`No Network exists with ID '${network.id}`);
    });
  });

  describe('PATCH /network/:networkID', () => {
    const { app, db } = setupIntegrationTest(NetworkController);

    const request = (accountID: string, networkID: string, data: PatchNetwork): Promise<Serialized<Network>> =>
      app()
        .handle(
          new MockRequest(`/network/${networkID}`, {
            method: 'patch',
            json: data,
            headers: { 'test-principal': accountID },
          }),
        )
        .then(async (res) => {
          if (res.ok) return res.json();

          throw new Error(await res.text());
        });

    test('update network details', async () => {
      const data = { name: 'The Tans' };
      const { account } = await createAccount(db());
      const network = await createNetwork(db(), account.id);

      const result = await request(account.id, network.id, data);

      expect(result).toEqual(expect.objectContaining(data));
    });

    test('reject non-members', async () => {
      const data = { name: 'The Tans' };
      const { account: memberAccount } = await createAccount(db());
      const { account: nonMemberAccount } = await createAccount(db());
      const network = await createNetwork(db(), memberAccount.id);

      expect(() => request(nonMemberAccount.id, network.id, data)).toThrowError(
        `No Network exists with ID '${network.id}`,
      );
    });

    test('reject non-leaders', async () => {
      const data = { name: 'The Tans' };
      const { account } = await createAccount(db());
      const network = await createNetwork(db(), account.id);
      await createNetworkMember(db(), network.id, NetworkRole.LEADER);

      expect(() => request(account.id, network.id, data)).toThrowError('Only leaders can update Network details');
    });
  });

  describe('DELETE /network/:networkID', () => {
    const { app, db } = setupIntegrationTest(NetworkController);

    const request = (accountID: string, networkID: string) =>
      app()
        .handle(
          new MockRequest(`/network/${networkID}`, {
            method: 'delete',
            headers: { 'test-principal': accountID },
          }),
        )
        .then(async (res) => {
          if (!res.ok) throw new Error(await res.text());
        });

    test('delete network', async () => {
      const { account } = await createAccount(db());
      const network = await createNetwork(db(), account.id);

      await request(account.id, network.id);

      expect(await db().$count(NetworkDB, eq(NetworkDB.id, network.id))).toBe(0);
    });

    test('reject non-members', async () => {
      const { account: memberAccount } = await createAccount(db());
      const { account: nonMemberAccount } = await createAccount(db());
      const network = await createNetwork(db(), memberAccount.id);

      expect(() => request(nonMemberAccount.id, network.id)).toThrowError(`No Network exists with ID '${network.id}`);
    });

    test('reject if multiple members', async () => {
      const { account } = await createAccount(db());
      const network = await createNetwork(db(), account.id);
      await createNetworkMember(db(), network.id);

      expect(() => request(account.id, network.id)).toThrowError(
        'Networks with more than one member cannot be deleted',
      );
    });
  });

  describe('DELETE /network/:networkID/membership', () => {
    const { app, db } = setupIntegrationTest(NetworkController);

    const request = (accountID: string, networkID: string) =>
      app()
        .handle(
          new MockRequest(`/network/${networkID}/membership`, {
            method: 'delete',
            headers: { 'test-principal': accountID },
          }),
        )
        .then(async (res) => {
          if (!res.ok) throw new Error(await res.text());
        });

    test('delete network membership', async () => {
      const { account } = await createAccount(db());
      const network = await createNetwork(db(), account.id);
      await createNetworkMember(db(), network.id);

      await request(account.id, network.id);

      expect(await db().$count(NetworkMemberDB, eq(NetworkMemberDB.networkID, network.id))).toBe(1);
    });

    test('clean up network if all members are deleted', async () => {
      const { account } = await createAccount(db());
      const network = await createNetwork(db(), account.id);

      await request(account.id, network.id);

      expect(await db().$count(NetworkMemberDB, eq(NetworkMemberDB.networkID, network.id))).toBe(0);
      expect(await db().$count(NetworkDB, eq(NetworkDB.id, network.id))).toBe(0);
    });
  });

  describe('DELETE /network/:networkID/member/:accountID', () => {
    const { app, db } = setupIntegrationTest(NetworkController);

    const request = (principalID: string, networkID: string, memberID: string) =>
      app()
        .handle(
          new MockRequest(`/network/${networkID}/member/${memberID}`, {
            method: 'delete',
            headers: { 'test-principal': principalID },
          }),
        )
        .then(async (res) => {
          if (!res.ok) throw new Error(await res.text());
        });

    test('delete network member', async () => {
      const { account } = await createAccount(db());
      const network = await createNetwork(db(), account.id);
      const { account: networkMember } = await createNetworkMember(db(), network.id);
      await updateOne(db(), NetworkMemberDB, eq(NetworkMemberDB.accountID, account.id), {
        role: NetworkRole.LEADER,
      });

      await request(account.id, network.id, networkMember.id);

      expect(await db().$count(NetworkMemberDB, eq(NetworkMemberDB.networkID, network.id))).toBe(1);
    });

    test('clean up network if all members are deleted', async () => {
      const { account } = await createAccount(db());
      const network = await createNetwork(db(), account.id);
      await updateOne(db(), NetworkMemberDB, eq(NetworkMemberDB.accountID, account.id), {
        role: NetworkRole.LEADER,
      });

      await request(account.id, network.id, account.id);

      expect(await db().$count(NetworkMemberDB, eq(NetworkMemberDB.networkID, network.id))).toBe(0);
      expect(await db().$count(NetworkDB, eq(NetworkDB.id, network.id))).toBe(0);
    });

    test('reject non-members', async () => {
      const { account: memberAccount } = await createAccount(db());
      const { account: nonMemberAccount } = await createAccount(db());
      const network = await createNetwork(db(), memberAccount.id);
      const { account: networkMember } = await createNetworkMember(db(), network.id);

      expect(() => request(nonMemberAccount.id, network.id, networkMember.id)).toThrowError(
        `No Network exists with ID '${network.id}`,
      );
    });

    test('reject non-leaders', async () => {
      const { account } = await createAccount(db());
      const network = await createNetwork(db(), account.id);
      const { account: networkMember } = await createNetworkMember(db(), network.id);

      expect(() => request(account.id, network.id, networkMember.id)).toThrowError(
        'Only leaders can remove other Network members',
      );
    });
  });
});
