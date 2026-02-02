import { App } from '@api/app/app.module';
import { DatabaseGlobal } from '@api/db/db.global';
import { ElysiaCommand } from '@api/global/elysia-command';
import { HeartbeatService } from './heartbeat.service';

await new ElysiaCommand(App, { name: 'cron.heartbeat_expiry' }).run(() =>
  new HeartbeatService(DatabaseGlobal.client).alertExpired(),
);
