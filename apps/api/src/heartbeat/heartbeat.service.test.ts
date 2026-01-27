import { afterEach, describe, expect, setSystemTime, test } from 'bun:test';
import { AccountService } from '@api/account/account.service';
import { AlertDB } from '@api/alert/data/alert.db';
import { AuthAlgorithm } from '@api/auth/data/auth-algorithm.enum';
import { AuthTransport } from '@api/auth/data/auth-transport.enum';
import type { DB } from '@api/db/db.types';
import type { CreateFamily } from '@api/family/data/create-family.req';
import { FamilyService } from '@api/family/family.service';
import type { CreateNetwork } from '@api/network/data/create-network.req';
import { NetworkService } from '@api/network/network.service';
import { RedisPlugin } from '@api/redis/redis.plugin';
import { insertOne } from '@bltx/db';
import { setupIntegrationTest } from '@test/setup.util';
import { addMinutes } from 'date-fns';
import { eq } from 'drizzle-orm';
import { HeartbeatExpiredAlertDB } from './data/heartbeat-expired-alert.db';
import { HeartbeatController } from './heartbeat.controller';
import { HeartbeatService } from './heartbeat.service';

const TTL = 100;

describe('HeartbeatService', () => {
  const createAccount = (db: DB) => {
    return new AccountService(db).create({
      id: Bun.randomUUIDv7(),
      publicKey: 'public-key',
      algorithm: AuthAlgorithm.EdDSA,
      transports: [AuthTransport.NFC],
    });
  };

  const createFamily = (db: DB, accountID: string, { name = 'My Family', ...data }: Partial<CreateFamily> = {}) => {
    return new FamilyService(db, RedisPlugin.decorator.redis()).create(accountID, { name, ...data });
  };

  const createNetwork = (db: DB, accountID: string, { name = 'My Network', ...data }: Partial<CreateNetwork> = {}) => {
    return new NetworkService(db, RedisPlugin.decorator.redis()).create(accountID, { name, ...data });
  };

  afterEach(() => {
    setSystemTime();
  });

  describe('alertExpired()', () => {
    const { db } = setupIntegrationTest(HeartbeatController);

    test('create alerts for expired heartbeats', async () => {
      const { account } = await createAccount(db());
      const network = await createNetwork(db(), account.id);
      const service = new HeartbeatService(db());
      const heartbeat = await service.create(account.id, { triggers: [{ networkID: network.id, ttl: TTL }] });

      setSystemTime(addMinutes(new Date(), TTL + 1));

      await service.alertExpired();

      expect(await db().$count(HeartbeatExpiredAlertDB, eq(HeartbeatExpiredAlertDB.heartbeatID, heartbeat.id))).toBe(1);
    });

    test('create separate family and network alerts', async () => {
      const { account } = await createAccount(db());
      const family = await createFamily(db(), account.id);
      const network = await createNetwork(db(), account.id);
      const service = new HeartbeatService(db());
      const heartbeat = await service.create(account.id, {
        triggers: [
          { familyID: family.id, ttl: TTL },
          { networkID: network.id, ttl: TTL },
        ],
      });
      const alert = await insertOne(db(), AlertDB, { networkID: network.id });
      await insertOne(db(), HeartbeatExpiredAlertDB, { alertID: alert.id, heartbeatID: heartbeat.id });

      setSystemTime(addMinutes(new Date(), TTL + 1));

      await service.alertExpired();

      expect(await db().$count(HeartbeatExpiredAlertDB, eq(HeartbeatExpiredAlertDB.heartbeatID, heartbeat.id))).toBe(2);
    });

    test('skip heartbeat triggers that have been recently updated', async () => {
      const { account } = await createAccount(db());
      const network = await createNetwork(db(), account.id);
      const service = new HeartbeatService(db());
      const heartbeat = await service.create(account.id, { triggers: [{ networkID: network.id, ttl: TTL }] });

      await service.alertExpired();

      expect(await db().$count(HeartbeatExpiredAlertDB, eq(HeartbeatExpiredAlertDB.heartbeatID, heartbeat.id))).toBe(0);
    });

    test('skip heartbeat triggers with existing alerts', async () => {
      const { account } = await createAccount(db());
      const network = await createNetwork(db(), account.id);
      const service = new HeartbeatService(db());
      const heartbeat = await service.create(account.id, { triggers: [{ networkID: network.id, ttl: TTL }] });
      const alert = await insertOne(db(), AlertDB, { networkID: network.id });
      await insertOne(db(), HeartbeatExpiredAlertDB, { alertID: alert.id, heartbeatID: heartbeat.id });

      setSystemTime(addMinutes(new Date(), TTL + 1));

      await service.alertExpired();

      expect(await db().$count(HeartbeatExpiredAlertDB, eq(HeartbeatExpiredAlertDB.heartbeatID, heartbeat.id))).toBe(1);
    });
  });
});
