import { DatabasePlugin } from '@api/db/db.plugin';
import { eq } from 'drizzle-orm';
import Elysia, { t } from 'elysia';
import { AlertService } from './alert.service';
import { AlertDB } from './data/alert.db';
import { AlertDTO } from './data/alert.dto';

const AlertParams = t.Object({ alertID: t.String({ format: 'uuid' }) });

export const AlertController = new Elysia({ prefix: '/alert' })
  .use(DatabasePlugin)
  .derive({ as: 'scoped' }, ({ db }) => ({ service: new AlertService(db()) }))

  .get(
    '/',
    async ({ db }) => {
      return db().query.AlertDB.findMany();
    },
    {
      response: t.Array(AlertDTO),
    },
  )

  .get(
    '/:alertID',
    async ({ db, params, status }) => {
      const alert = await db().query.AlertDB.findFirst({ where: eq(AlertDB.id, params.alertID) });
      if (!alert) return status(404, `No Alert exists with ID '${params.alertID}'`);

      return alert;
    },
    {
      params: AlertParams,
      response: {
        200: AlertDTO,
        404: t.String(),
      },
    },
  )

  .delete(
    '/:alertID',
    async ({ service, params }) => {
      await service.delete(params.alertID);
    },
    {
      params: AlertParams,
    },
  );
