import { DatabaseGlobal } from '@api/db/db.global';
import Elysia from 'elysia';
import { HealthService } from './health.service';

export const HealthController = new Elysia({ prefix: '/health' })
  .derive({ as: 'scoped' }, () => ({ service: new HealthService(DatabaseGlobal.client) }))

  .get('/ready', async ({ service }) => {
    await service.assertReady();

    return 'ok';
  })

  .get('/live', async ({ service }) => {
    await service.assertLive();

    return 'ok';
  });
