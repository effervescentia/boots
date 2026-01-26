import type { RedisClient } from 'bun';

export interface SetOptions {
  ttl?: number;
}

export class RedisService {
  constructor(private readonly client: RedisClient) {}

  setHashField(hashKey: string, key: string, value: string, { ttl }: SetOptions = {}) {
    if (typeof ttl === 'number') {
      return this.client.hsetex(hashKey, 'EX', ttl, 'FIELDS', 1, key, value);
    }

    return this.client.hsetex(hashKey, 'FIELDS', 1, key, value);
  }

  getHashField(hashKey: string, key: string) {
    return this.client.hget(hashKey, key);
  }

  async getDeleteHashField(hashKey: string, key: string) {
    const results = await this.client.hgetdel(hashKey, 'FIELDS', 1, key);
    return results[0]!;
  }
}
