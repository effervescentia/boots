import { EnvironmentPlugin } from '@api/env/env.plugin';
import Elysia from 'elysia';
import { RedisGlobal } from './redis.global';

export const RedisPlugin = new Elysia({ name: 'plugin.redis' }).use(EnvironmentPlugin).use(async (app) => {
  await RedisGlobal.init(app.decorator.env);
  return app;
});
