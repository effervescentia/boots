import type { Environment } from '@api/app/app.env';
import { RedisService } from './redis.service';

// biome-ignore lint/complexity/noStaticOnlyClass: global
export class RedisGlobal {
  static service: RedisService;

  static async init(env: Environment) {
    const client = new Bun.RedisClient(
      `redis://${env.REDIS_USERNAME}:${env.REDIS_PASSWORD}@${env.REDIS_HOSTNAME}:${env.REDIS_PORT}`,
    );

    RedisGlobal.service = new RedisService(client);

    await client.connect();
  }
}
