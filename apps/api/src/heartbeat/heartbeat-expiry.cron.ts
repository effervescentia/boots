import { App } from '@api/app/app.module';
import Elysia from 'elysia';
import { HeartbeatService } from './heartbeat.service';

const HeartbeatExpiryCron = new Elysia({ name: 'cron.heartbeat_expiry' }).use(App);

await HeartbeatExpiryCron.modules;

await new HeartbeatService(HeartbeatExpiryCron.decorator.db()).alertExpired();
