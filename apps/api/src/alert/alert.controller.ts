import { DatabasePlugin } from '@api/db/db.plugin';
import Elysia, { t } from 'elysia';
import { AlertService } from './alert.service';
import { AlertDetailsDTO } from './data/alert-details.dto';

export const AlertController = new Elysia({ prefix: '/alert' })
  .use(DatabasePlugin)
  .derive({ as: 'scoped' }, ({ db }) => ({ service: new AlertService(db()) }))

  .get(
    '/family/:familyID',
    async ({ service, params }) => {
      return service.getMany({ familyID: params.familyID });
    },
    {
      params: t.Object({ familyID: t.String({ format: 'uuid' }) }),
      response: t.Array(AlertDetailsDTO),
    },
  )

  .get(
    '/network/:networkID',
    async ({ service, params }) => {
      return service.getMany({ networkID: params.networkID });
    },
    {
      params: t.Object({ networkID: t.String({ format: 'uuid' }) }),
      response: t.Array(AlertDetailsDTO),
    },
  );
