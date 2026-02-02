import { AccountController } from '@api/account/account.controller';
import { AlertController } from '@api/alert/alert.controller';
import { AuthModule } from '@api/auth/auth.module';
import { DatabasePlugin } from '@api/db/db.plugin';
import { EnvironmentPlugin } from '@api/env/env.plugin';
import { FamilyController } from '@api/family/family.controller';
import { FirebasePlugin } from '@api/firebase/firebase.plugin';
import { HealthController } from '@api/health/health.controller';
import { HeartbeatController } from '@api/heartbeat/heartbeat.controller';
import { NetworkController } from '@api/network/network.controller';
import { NotifyController } from '@api/notify/notify.controller';
import { RedisPlugin } from '@api/redis/redis.plugin';
import { cors } from '@elysiajs/cors';
import Elysia from 'elysia';

export type App = typeof App;

// TODO: write custom logger plugin
export const App = new Elysia()
  .use(cors({ credentials: true, maxAge: 60 }))
  .use(EnvironmentPlugin)
  .use(DatabasePlugin)
  .use(RedisPlugin)
  .use(FirebasePlugin)

  .use(HealthController)
  .use(AuthModule)
  .use(AccountController)
  .use(FamilyController)
  .use(NetworkController)
  .use(HeartbeatController)
  .use(AlertController)
  .use(NotifyController);
