import { EnvironmentGlobal } from '@api/env/env.global';
import Elysia from 'elysia';
import { RedisGlobal } from './redis.global';

export const RedisPlugin = new Elysia({ name: 'plugin.redis' }).use((app) => {
  return app.use(async (app) => {
    await RedisGlobal.init(EnvironmentGlobal.data);
    return app;
  });
});
