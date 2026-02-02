import Elysia from 'elysia';
import { AuthAndroidController } from './android/auth-android.controller';
import { AuthSessionController } from './session/auth-session.controller';
import { AuthWebController } from './web/auth-web.controller';

export const AuthModule = new Elysia({ prefix: '/auth' })
  .use(AuthSessionController)
  .use(AuthWebController)
  .use(AuthAndroidController);
