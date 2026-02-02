import { RedisGlobal } from '@api/redis/redis.global';
import { RedisService } from '@api/redis/redis.service';
import { RedisContainer } from '@testcontainers/redis';

// biome-ignore lint/complexity/noStaticOnlyClass: global mock
export class RedisMock {
  static async init() {
    const container = await new RedisContainer('redis:latest').start();

    const redis = new RedisService(new Bun.RedisClient(`redis://${container.getHost()}:${container.getPort()}`));

    await redis.client.connect();

    RedisGlobal.service = redis;
  }
}
