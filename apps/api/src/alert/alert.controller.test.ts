import { describe, expect, test } from 'bun:test';
import { AccountService } from '@api/account/account.service';
import { AuthAlgorithm } from '@api/auth/data/auth-algorithm.enum';
import { AuthTransport } from '@api/auth/data/auth-transport.enum';
import type { DB } from '@api/db/db.types';
import type { CreateFamily } from '@api/family/data/create-family.req';
import { FamilyService } from '@api/family/family.service';
import { HeartbeatService } from '@api/heartbeat/heartbeat.service';
import type { CreateNetwork } from '@api/network/data/create-network.req';
import { NetworkService } from '@api/network/network.service';
import { RedisPlugin } from '@api/redis/redis.plugin';
import { MockRequest, type Serialized, serialize } from '@bltx/test';
import { setAuthPrincipal } from '@test/request.util';
import { setupIntegrationTest } from '@test/setup.util';
import { AlertController } from './alert.controller';
import { AlertService } from './alert.service';
import type { AlertDetails } from './data/alert-details.dto';
import { AlertType } from './data/alert-type.enum';

describe('AlertController', () => {
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

  describe('GET /alert/family/:familyID', () => {
    const { app, db } = setupIntegrationTest(AlertController);

    const request = (accountID: string, familyID: string): Promise<Serialized<AlertDetails[]>> =>
      app()
        .handle(
          new MockRequest(`/alert/family/${familyID}`, {
            method: 'get',
            headers: setAuthPrincipal(accountID),
          }),
        )
        .then((res) => res.json());

    test('get family alerts', async () => {
      const service = new AlertService(db());
      const { account } = await createAccount(db());
      const family = await createFamily(db(), account.id);
      const network = await createNetwork(db(), account.id);
      const heartbeat = await new HeartbeatService(db()).create(account.id, {
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
    const { app, db } = setupIntegrationTest(AlertController);

    const request = (accountID: string, networkID: string): Promise<Serialized<AlertDetails[]>> =>
      app()
        .handle(
          new MockRequest(`/alert/network/${networkID}`, {
            method: 'get',
            headers: setAuthPrincipal(accountID),
          }),
        )
        .then((res) => res.json());

    test('get network alerts', async () => {
      const service = new AlertService(db());
      const { account } = await createAccount(db());
      const family = await createFamily(db(), account.id);
      const network = await createNetwork(db(), account.id);
      const heartbeat = await new HeartbeatService(db()).create(account.id, {
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
