import { EnvironmentGlobal } from '@api/env/env.global';
import { RedisContainer } from '@testcontainers/redis';
import Elysia from 'elysia';
import { RedisGlobal } from './redis.global';
import { RedisService } from './redis.service';

export const RedisPlugin = new Elysia({ name: 'plugin.redis' }).use((app) => {
  // if (import.meta.env.NODE_ENV === 'test') {
  //   let redis: RedisService;

  //   return app.decorate({ redis: () => redis }).use(async (app) => {
  //     const container = await new RedisContainer('redis:latest').start();

  //     redis = new RedisService(new Bun.RedisClient(`redis://${container.getHost()}:${container.getPort()}`));

  //     await redis.client.connect();

  //     return app;
  //   });
  // }

  return app.use(async (app) => {
    await RedisGlobal.init(EnvironmentGlobal.data);
    return app;
  });
});
