import { describe, expect, test } from 'bun:test';
import { AccountService } from '@api/account/account.service';
import { AuthAlgorithm } from '@api/auth/data/auth-algorithm.enum';
import { AuthTransport } from '@api/auth/data/auth-transport.enum';
import type { DB } from '@api/db/db.types';
import type { CreateNetwork } from '@api/network/data/create-network.req';
import { NetworkService } from '@api/network/network.service';
import { RedisPlugin } from '@api/redis/redis.plugin';
import { MockRequest, type Serialized, serialize } from '@bltx/test';
import { setAuthPrincipal, unwrap } from '@test/request.util';
import { setupIntegrationTest } from '@test/setup.util';
import { eq } from 'drizzle-orm';
import type { CreateHeartbeat } from './data/create-heartbeat.req';
import { HeartbeatDB } from './data/heartbeat.db';
import type { Heartbeat } from './data/heartbeat.dto';
import { HeartbeatAlertDB } from './data/heartbeat-alert.db';
import { HeartbeatController } from './heartbeat.controller';
import { HeartbeatService } from './heartbeat.service';

describe('HeartbeatController', () => {
  const createAccount = (db: DB) => {
    return new AccountService(db).create({
      id: Bun.randomUUIDv7(),
      publicKey: 'public-key',
      algorithm: AuthAlgorithm.EdDSA,
      transports: [AuthTransport.NFC],
    });
  };

  const createNetwork = (db: DB, accountID: string, { name = 'My Network', ...data }: Partial<CreateNetwork> = {}) => {
    return new NetworkService(db, RedisPlugin.decorator.redis()).create(accountID, { name, ...data });
  };

  describe('POST /heartbeat', () => {
    const { app, db } = setupIntegrationTest(HeartbeatController);

    const request = (accountID: string, data: CreateHeartbeat): Promise<Serialized<Heartbeat>> =>
      app()
        .handle(
          new MockRequest('/heartbeat', {
            method: 'post',
            json: data,
            headers: setAuthPrincipal(accountID),
          }),
        )
        .then(unwrap);

    test('create a heartbeat', async () => {
      const { account } = await createAccount(db());
      const network = await createNetwork(db(), account.id);

      const result = await request(account.id, { alerts: [{ ttl: 400, networkID: network.id }] });

      expect(result).toEqual(expect.objectContaining({ id: expect.any(String), accountID: account.id }));
      expect(serialize(await db().query.HeartbeatDB.findFirst({ where: eq(HeartbeatDB.id, result.id) }))).toEqual(
        result,
      );
      expect(await db().query.HeartbeatAlertDB.findMany({ where: eq(HeartbeatAlertDB.networkID, network.id) })).toEqual(
        [
          expect.objectContaining({
            networkID: network.id,
            heartbeatID: result.id,
            ttl: 400,
          }),
        ],
      );
    });

    test('reject multiple heartbeats', async () => {
      const { account } = await createAccount(db());
      const network = await createNetwork(db(), account.id);
      await new HeartbeatService(db()).create(account.id, { alerts: [{ ttl: 300, networkID: network.id }] });

      expect(() => request(account.id, { alerts: [{ ttl: 400, networkID: network.id }] })).toThrowError(
        'Each account can only have one Heartbeat configured',
      );
    });
  });

  describe('PUT /heartbeat/:heartbeatID/ping', () => {
    const { app, db } = setupIntegrationTest(HeartbeatController);

    const request = (accountID: string, heartbeatID: string): Promise<Serialized<Heartbeat>> =>
      app()
        .handle(
          new MockRequest(`/heartbeat/${heartbeatID}/ping`, {
            method: 'put',
            headers: setAuthPrincipal(accountID),
          }),
        )
        .then(unwrap);

    test('update a heartbeat', async () => {
      const { account } = await createAccount(db());
      const network = await createNetwork(db(), account.id);
      const heartbeat = await new HeartbeatService(db()).create(account.id, {
        alerts: [{ ttl: 400, networkID: network.id }],
      });

      const result = await request(account.id, heartbeat.id);

      expect(new Date(result.updatedAt)).toBeAfter(heartbeat.updatedAt);
    });
  });

  describe('DELETE /heartbeat/:heartbeatID', () => {
    const { app, db } = setupIntegrationTest(HeartbeatController);

    const request = (accountID: string, heartbeatID: string) =>
      app().handle(
        new MockRequest(`/heartbeat/${heartbeatID}`, {
          method: 'delete',
          headers: setAuthPrincipal(accountID),
        }),
      );

    test('delete a heartbeat', async () => {
      const { account } = await createAccount(db());
      const network = await createNetwork(db(), account.id);
      const heartbeat = await new HeartbeatService(db()).create(account.id, {
        alerts: [{ ttl: 400, networkID: network.id }],
      });

      await request(account.id, heartbeat.id);

      expect(await db().$count(HeartbeatDB, eq(HeartbeatDB.id, heartbeat.id))).toBe(0);
      expect(await db().$count(HeartbeatAlertDB, eq(HeartbeatAlertDB.heartbeatID, heartbeat.id))).toBe(0);
    });
  });
});
