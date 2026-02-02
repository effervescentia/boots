import { AccountController } from '@api/account/account.controller';
import { AlertController } from '@api/alert/alert.controller';
import { AuthModule } from '@api/auth/auth.module';
import { DatabaseGlobal } from '@api/db/db.global';
import { FamilyController } from '@api/family/family.controller';
import { EnvironmentPlugin } from '@api/global/environment.plugin';
import { HealthController } from '@api/health/health.controller';
import { HeartbeatController } from '@api/heartbeat/heartbeat.controller';
import { NetworkController } from '@api/network/network.controller';
import { NotifyController } from '@api/notify/notify.controller';
import { RedisGlobal } from '@api/redis/redis.global';
import { cors } from '@elysiajs/cors';
import Elysia from 'elysia';

export type App = typeof App;

// TODO: write custom logger plugin
export const App = new Elysia()
  .use(cors({ credentials: true, maxAge: 60 }))
  .use(EnvironmentPlugin)
  .use(async (app) => {
    await RedisGlobal.init(app.decorator.env());
    await DatabaseGlobal.init(app.decorator.env());
    return app;
  })

  .use(HealthController)
  .use(AuthModule)
  .use(AccountController)
  .use(FamilyController)
  .use(NetworkController)
  .use(HeartbeatController)
  .use(AlertController)
  .use(NotifyController);
