import { AccountController } from '@api/account/account.controller';
import { AlertController } from '@api/alert/alert.controller';
import { AuthAndroidController } from '@api/auth/android/auth-android.controller';
import { AuthSessionController } from '@api/auth/session/auth-session.controller';
import { AuthWebController } from '@api/auth/web/auth-web.controller';
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
import { staticPlugin } from '@elysiajs/static';
import Elysia from 'elysia';
import logixlysia from 'logixlysia';

export type App = typeof App;

export const App = new Elysia()
  .use(logixlysia())
  .use(cors({ credentials: true, maxAge: 60 }))
  .use(staticPlugin({ prefix: '' }))
  .use(EnvironmentPlugin)
  .use(DatabasePlugin)
  .use(RedisPlugin)
  .use(FirebasePlugin)

  .use(HealthController)
  .use(AuthSessionController)
  .use(AuthWebController)
  .use(AuthAndroidController)
  .use(AccountController)
  .use(FamilyController)
  .use(NetworkController)
  .use(HeartbeatController)
  .use(AlertController)
  .use(NotifyController);
