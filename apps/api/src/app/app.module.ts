import { AccountController } from '@api/account/account.controller';
import { AuthController } from '@api/auth/auth.controller';
import { EnvironmentPlugin } from '@api/global/environment.plugin';
import { HealthController } from '@api/health/health.controller';
import { MemoController } from '@api/memo/memo.controller';
import { cors } from '@elysiajs/cors';
import Elysia from 'elysia';

export type App = typeof App;

// TODO: write custom logger plugin
export const App = new Elysia()
  .use(cors({ credentials: true, maxAge: 60 }))

  .use(EnvironmentPlugin)
  .use(HealthController)

  .use(AuthController)
  .use(AccountController);
// .use(MemoController);
