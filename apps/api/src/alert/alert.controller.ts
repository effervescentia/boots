import { AuthPlugin } from '@api/auth/auth.plugin';
import { DatabasePlugin } from '@api/db/db.plugin';
import { FamilyService } from '@api/family/family.service';
import { FirebasePlugin } from '@api/firebase/firebase.plugin';
import { NetworkService } from '@api/network/network.service';
import { RedisPlugin } from '@api/redis/redis.plugin';
import Elysia, { NotFoundError, t } from 'elysia';
import { AlertService } from './alert.service';
import { AlertDetailsDTO } from './data/alert-details.dto';

const AlertParams = t.Object({ alertID: t.String({ format: 'uuid' }) });

class AlertNotFoundError extends NotFoundError {
  constructor(alertID: string) {
    super(`No Alert exists with ID '${alertID}'`);
  }
}

export const AlertController = new Elysia({ prefix: '/alert' })
  .use(DatabasePlugin)
  .use(RedisPlugin)
  .use(AuthPlugin)
  .use(FirebasePlugin)
  .derive({ as: 'scoped' }, ({ db, redis, firebase }) => ({
    service: new AlertService(db(), firebase()),
    familyService: new FamilyService(db(), redis()),
    networkService: new NetworkService(db(), redis()),
  }))

  .get(
    '/:alertID',
    async ({ service, familyService, networkService, params, principal }) => {
      const alert = await service.getDetails(params.alertID);
      if (!alert) throw new AlertNotFoundError(params.alertID);

      try {
        if (alert.familyID) {
          await familyService.assertMembership(alert.familyID, principal.id);
        } else if (alert.networkID) {
          await networkService.assertMembership(alert.networkID, principal.id);
        }
      } catch {
        throw new AlertNotFoundError(params.alertID);
      }

      return alert;
    },
    {
      authenticated: true,
      params: AlertParams,
      response: AlertDetailsDTO,
    },
  )

  .get(
    '/family/:familyID',
    async ({ service, familyService, params, principal }) => {
      await familyService.assertMembership(params.familyID, principal.id);

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
      await networkService.assertMembership(params.networkID, principal.id);

      return service.getMany({ networkID: params.networkID });
    },
    {
      authenticated: true,
      params: t.Object({ networkID: t.String({ format: 'uuid' }) }),
      response: t.Array(AlertDetailsDTO),
    },
  );
