import type { DB } from '@api/db/db.types';
import { RedisGlobal } from '@api/redis/redis.global';
import { sql } from 'drizzle-orm';
import { NotFoundError } from 'elysia';

export class HealthService {
  private readonly redis = RedisGlobal.service;

  constructor(private readonly db: DB) {}

  async assertReady() {
    if (!this.db) throw new NotFoundError('database client not found');
    if (!this.redis) throw new NotFoundError('redis client not found');

    const count = await this.db.$count(sql`(SELECT 1)`).catch(() => 0);

    if (count !== 1) throw new NotFoundError('database client not ready');

    await this.redis.client.ping().catch(() => {
      throw new NotFoundError('redis client not ready');
    });
  }

  async assertLive() {
    const count = await this.db.$count(sql`(SELECT NOW())`).catch(() => 0);

    if (count !== 1) throw new NotFoundError('database client not responding');

    await this.redis.client.ping().catch(() => {
      throw new NotFoundError('redis client not responding');
    });
  }
}
