import { App } from '@api/app/app.module';
import { ElysiaCommand } from '@api/global/elysia-command';
import { HeartbeatService } from './heartbeat.service';

await new ElysiaCommand(App, { name: 'cron.heartbeat_expiry' }).run(({ db, firebase }) =>
  new HeartbeatService(db(), firebase()).alertExpired(),
);
