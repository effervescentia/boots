import { afterEach, describe, expect, setSystemTime, test } from 'bun:test';
import { AlertService } from '@api/alert/alert.service';
import { AlertType } from '@api/alert/data/alert-type.enum';
import type { DB } from '@api/db/db.types';
import type { CreateFamily } from '@api/family/data/create-family.req';
import { FamilyService } from '@api/family/family.service';
import type { CreateNetwork } from '@api/network/data/create-network.req';
import { NetworkService } from '@api/network/network.service';
import { setupIntegrationTest } from '@test/setup.util';
import { addMinutes } from 'date-fns';
import { eq } from 'drizzle-orm';
import { HeartbeatExpiredAlertDB } from './data/heartbeat-expired-alert.db';
import { HeartbeatController } from './heartbeat.controller';
import { HeartbeatService } from './heartbeat.service';

const TTL = 100;

describe('HeartbeatService', () => {
  const createFamily = (db: DB, accountID: string, { name = 'My Family', ...data }: Partial<CreateFamily> = {}) => {
    return new FamilyService(db).create(accountID, { name, ...data });
  };

  const createNetwork = (db: DB, accountID: string, { name = 'My Network', ...data }: Partial<CreateNetwork> = {}) => {
    return new NetworkService(db).create(accountID, { name, ...data });
  };

  afterEach(() => {
    setSystemTime();
  });

  describe('alertExpired()', () => {
    const { db, fixture } = setupIntegrationTest(HeartbeatController);

    test('create alerts for expired heartbeats', async () => {
      const { account } = await fixture().createAccount();
      const network = await createNetwork(db(), account.id);
      const service = new HeartbeatService(db());
      const heartbeat = await service.create(account.id, { triggers: [{ networkID: network.id, ttl: TTL }] });

      setSystemTime(addMinutes(new Date(), TTL + 1));

      await service.alertExpired();

      expect(await db().$count(HeartbeatExpiredAlertDB, eq(HeartbeatExpiredAlertDB.heartbeatID, heartbeat.id))).toBe(1);
    });

    test('create separate family and network alerts', async () => {
      const { account } = await fixture().createAccount();
      const family = await createFamily(db(), account.id);
      const network = await createNetwork(db(), account.id);
      const service = new HeartbeatService(db());
      const heartbeat = await service.create(account.id, {
        triggers: [
          { familyID: family.id, ttl: TTL },
          { networkID: network.id, ttl: TTL },
        ],
      });
      await new AlertService(db()).create({ networkID: network.id }, AlertType.HEARTBEAT_EXPIRED, {
        heartbeatID: heartbeat.id,
      });

      setSystemTime(addMinutes(new Date(), TTL + 1));

      await service.alertExpired();

      expect(await db().$count(HeartbeatExpiredAlertDB, eq(HeartbeatExpiredAlertDB.heartbeatID, heartbeat.id))).toBe(2);
    });

    test('skip heartbeat triggers that have been recently updated', async () => {
      const { account } = await fixture().createAccount();
      const network = await createNetwork(db(), account.id);
      const service = new HeartbeatService(db());
      const heartbeat = await service.create(account.id, { triggers: [{ networkID: network.id, ttl: TTL }] });

      await service.alertExpired();

      expect(await db().$count(HeartbeatExpiredAlertDB, eq(HeartbeatExpiredAlertDB.heartbeatID, heartbeat.id))).toBe(0);
    });

    test('skip heartbeat triggers with existing alerts', async () => {
      const { account } = await fixture().createAccount();
      const network = await createNetwork(db(), account.id);
      const service = new HeartbeatService(db());
      const heartbeat = await service.create(account.id, { triggers: [{ networkID: network.id, ttl: TTL }] });
      await new AlertService(db()).create({ networkID: network.id }, AlertType.HEARTBEAT_EXPIRED, {
        heartbeatID: heartbeat.id,
      });

      setSystemTime(addMinutes(new Date(), TTL + 1));

      await service.alertExpired();

      expect(await db().$count(HeartbeatExpiredAlertDB, eq(HeartbeatExpiredAlertDB.heartbeatID, heartbeat.id))).toBe(1);
    });
  });
});
