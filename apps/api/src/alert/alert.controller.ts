import { AuthPlugin } from '@api/auth/auth.plugin';
import { DatabasePlugin } from '@api/db/db.plugin';
import { FamilyNotFoundError } from '@api/family/data/family-not-found.error';
import { FamilyService } from '@api/family/family.service';
import { NetworkNotFoundError } from '@api/network/data/network-not-found.error';
import { NetworkService } from '@api/network/network.service';
import { RedisPlugin } from '@api/redis/redis.plugin';
import Elysia, { t } from 'elysia';
import { AlertService } from './alert.service';
import { AlertDetailsDTO } from './data/alert-details.dto';

export const AlertController = new Elysia({ prefix: '/alert' })
  .use(DatabasePlugin)
  .use(RedisPlugin)
  .use(AuthPlugin)
  .derive({ as: 'scoped' }, ({ db, redis }) => ({
    service: new AlertService(db()),
    familyService: new FamilyService(db(), redis()),
    networkService: new NetworkService(db(), redis()),
  }))

  .get(
    '/family/:familyID',
    async ({ service, familyService, params, principal }) => {
      const membership = await familyService.getMembership(params.familyID, principal.id);
      if (!membership) throw new FamilyNotFoundError(params.familyID);

      return service.getMany({ familyID: params.familyID });
    },
    {
      authenticated: true,
      params: t.Object({ familyID: t.String({ format: 'uuid' }) }),
      response: t.Array(AlertDetailsDTO),
    },
  )

  .get(
    '/network/:networkID',
    async ({ service, networkService, params, principal }) => {
      const membership = await networkService.getMembership(params.networkID, principal.id);
      if (!membership) throw new NetworkNotFoundError(params.networkID);

      return service.getMany({ networkID: params.networkID });
    },
    {
      authenticated: true,
      params: t.Object({ networkID: t.String({ format: 'uuid' }) }),
      response: t.Array(AlertDetailsDTO),
    },
  );
