import { EnvironmentPlugin } from '@api/global/environment.plugin';
import { RedisContainer } from '@testcontainers/redis';
import { RedisClient } from 'bun';
import Elysia from 'elysia';

export const RedisPlugin = new Elysia({ name: 'plugin.redis' }).use((app) => {
  if (import.meta.env.NODE_ENV === 'test') {
    let redis: RedisClient;

    return app.decorate({ redis: () => redis }).use(async (app) => {
      const container = await new RedisContainer('redis:latest').start();

      redis = new RedisClient(`redis://${container.getHost()}:${container.getPort()}`);

      await redis.connect();

      return app;
    });
  }

  const env = EnvironmentPlugin.decorator.env();
  const redis = new RedisClient(
    `redis://${env.REDIS_USERNAME}:${env.REDIS_PASSWORD}@${env.REDIS_HOSTNAME}:${env.REDIS_PORT}`,
  );

  return app.decorate({ redis: () => redis }).use(async (app) => {
    await app.decorator.redis().connect();
    return app;
  });
});
