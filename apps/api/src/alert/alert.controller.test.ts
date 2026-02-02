import { describe, expect, test } from 'bun:test';
import type { DB } from '@api/db/db.types';
import type { CreateFamily } from '@api/family/data/create-family.req';
import { FamilyService } from '@api/family/family.service';
import { FirebasePlugin } from '@api/firebase/firebase.plugin';
import { HeartbeatService } from '@api/heartbeat/heartbeat.service';
import type { CreateNetwork } from '@api/network/data/create-network.req';
import { NetworkService } from '@api/network/network.service';
import { RedisPlugin } from '@api/redis/redis.plugin';
import { MockRequest, type Serialized, serialize } from '@bltx/test';
import { setAuthPrincipal, unwrap } from '@test/request.util';
import { setupIntegrationTest } from '@test/setup.util';
import { AlertController } from './alert.controller';
import { AlertService } from './alert.service';
import type { AlertDetails } from './data/alert-details.dto';
import { AlertType } from './data/alert-type.enum';

describe('AlertController', () => {
  const createFamily = (db: DB, accountID: string, { name = 'My Family', ...data }: Partial<CreateFamily> = {}) => {
    return new FamilyService(db, RedisPlugin.decorator.redis()).create(accountID, { name, ...data });
  };

  const createNetwork = (db: DB, accountID: string, { name = 'My Network', ...data }: Partial<CreateNetwork> = {}) => {
    return new NetworkService(db, RedisPlugin.decorator.redis()).create(accountID, { name, ...data });
  };

  describe('GET /alert/:alertID', () => {
    const { app, db, fixture } = setupIntegrationTest(AlertController);

    const request = (accountID: string, alertID: string): Promise<Serialized<AlertDetails>> =>
      app()
        .handle(
          new MockRequest(`/alert/${alertID}`, {
            method: 'get',
            headers: setAuthPrincipal(accountID),
          }),
        )
        .then(unwrap);

    test('get alert', async () => {
      const service = new AlertService(db(), FirebasePlugin.decorator.firebase());
      const { account } = await fixture().createAccount();
      const family = await createFamily(db(), account.id);
      const heartbeat = await new HeartbeatService(db(), FirebasePlugin.decorator.firebase()).create(account.id, {
        triggers: [{ familyID: family.id, ttl: 100 }],
      });
      const alert = await service.create({ familyID: family.id }, AlertType.HEARTBEAT_EXPIRED, {
        heartbeatID: heartbeat.id,
      });

      const result = await request(account.id, alert.id);

      expect(result).toEqual({
        ...serialize(alert),
        data: expect.objectContaining({ type: AlertType.HEARTBEAT_EXPIRED, heartbeatID: heartbeat.id }),
      });
    });
  });

  describe('GET /alert/family/:familyID', () => {
    const { app, db, fixture } = setupIntegrationTest(AlertController);

    const request = (accountID: string, familyID: string): Promise<Serialized<AlertDetails[]>> =>
      app()
        .handle(
          new MockRequest(`/alert/family/${familyID}`, {
            method: 'get',
            headers: setAuthPrincipal(accountID),
          }),
        )
        .then(unwrap);

    test('get family alerts', async () => {
      const service = new AlertService(db(), FirebasePlugin.decorator.firebase());
      const { account } = await fixture().createAccount();
      const family = await createFamily(db(), account.id);
      const network = await createNetwork(db(), account.id);
      const heartbeat = await new HeartbeatService(db(), FirebasePlugin.decorator.firebase()).create(account.id, {
        triggers: [
          { networkID: network.id, ttl: 100 },
          { familyID: family.id, ttl: 100 },
        ],
      });
      const alert = await service.create({ familyID: family.id }, AlertType.HEARTBEAT_EXPIRED, {
        heartbeatID: heartbeat.id,
      });
      await service.create({ networkID: network.id }, AlertType.HEARTBEAT_EXPIRED, { heartbeatID: heartbeat.id });

      const result = await request(account.id, family.id);

      expect(result).toEqual([
        {
          ...serialize(alert),
          data: expect.objectContaining({ type: AlertType.HEARTBEAT_EXPIRED, heartbeatID: heartbeat.id }),
        },
      ]);
    });
  });

  describe('GET /alert/network/:networkID', () => {
    const { app, db, fixture } = setupIntegrationTest(AlertController);

    const request = (accountID: string, networkID: string): Promise<Serialized<AlertDetails[]>> =>
      app()
        .handle(
          new MockRequest(`/alert/network/${networkID}`, {
            method: 'get',
            headers: setAuthPrincipal(accountID),
          }),
        )
        .then(unwrap);

    test('get network alerts', async () => {
      const service = new AlertService(db(), FirebasePlugin.decorator.firebase());
      const { account } = await fixture().createAccount();
      const family = await createFamily(db(), account.id);
      const network = await createNetwork(db(), account.id);
      const heartbeat = await new HeartbeatService(db(), FirebasePlugin.decorator.firebase()).create(account.id, {
        triggers: [
          { networkID: network.id, ttl: 100 },
          { familyID: family.id, ttl: 100 },
        ],
      });
      const alert = await service.create({ networkID: network.id }, AlertType.HEARTBEAT_EXPIRED, {
        heartbeatID: heartbeat.id,
      });
      await service.create({ familyID: family.id }, AlertType.HEARTBEAT_EXPIRED, {
        heartbeatID: heartbeat.id,
      });

      const result = await request(account.id, network.id);

      expect(result).toEqual([
        {
          ...serialize(alert),
          data: expect.objectContaining({ type: AlertType.HEARTBEAT_EXPIRED, heartbeatID: heartbeat.id }),
        },
      ]);
    });
  });
});
