import { AlertDB } from '@api/alert/data/alert.db';
import { DatabasePlugin } from '@api/db/db.plugin';
import { FirebasePlugin } from '@api/firebase/firebase.plugin';
import { insertOne } from '@bltx/db';
import Elysia from 'elysia';
import { NotifyService } from './notify.service';

export const NotifyController = new Elysia({ prefix: '/notify' })
  .use(DatabasePlugin)
  .use(FirebasePlugin)
  .derive({ as: 'scoped' }, ({ firebase }) => ({ service: new NotifyService(firebase()) }))

  .post('/', async ({ db, service }) => {
    console.log('create notify');
    const alert = await insertOne(db(), AlertDB, {});

    await service.sendAlert('test_topic', alert);
  });
