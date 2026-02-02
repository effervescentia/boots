import { AlertDB } from '@api/alert/data/alert.db';
import { DatabaseGlobal } from '@api/db/db.global';
import { insertOne } from '@bltx/db';
import Elysia from 'elysia';
import { NotifyService } from './notify.service';

export const NotifyController = new Elysia({ prefix: '/notify' })
  .derive({ as: 'scoped' }, () => ({ service: new NotifyService() }))

  .post('/', async ({ service }) => {
    // TODO: implement me
    console.log('create notify');
    const alert = await insertOne(DatabaseGlobal.client, AlertDB, {});

    await service.sendAlert('test_topic', alert);
  });
