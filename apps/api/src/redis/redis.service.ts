import type { RedisClient } from 'bun';
import type { Static, TSchema } from 'elysia';
import { TypeCompiler } from 'elysia/type-system';

export interface SetOptions {
  ttl?: number;
}

export interface GetOptions {
  delete?: boolean;
}

export class RedisService {
  constructor(private readonly client: RedisClient) {}

  setHashField(hashKey: string, key: string, value: string, { ttl }: SetOptions = {}) {
    if (typeof ttl === 'number') {
      return this.client.hsetex(hashKey, 'EX', ttl, 'FIELDS', 1, key, value);
    }

    return this.client.hsetex(hashKey, 'FIELDS', 1, key, value);
  }

  async getHashField(hashKey: string, key: string, { delete: delete_ = false }: GetOptions = {}) {
    if (delete_) {
      const results = await this.client.hgetdel(hashKey, 'FIELDS', 1, key);
      return results[0]!;
    }

    return this.client.hget(hashKey, key);
  }

  setTypedHashField<Schema extends TSchema>(
    schema: Schema,
    hashKey: string,
    key: string,
    value: Static<Schema>,
    options?: SetOptions,
  ) {
    const encoded = TypeCompiler.Compile(schema).Encode(value);

    return this.setHashField(hashKey, key, JSON.stringify(encoded), options);
  }

  async getTypedHashField<Schema extends TSchema>(
    schema: Schema,
    hashKey: string,
    key: string,
    options?: GetOptions,
  ): Promise<Static<Schema>> {
    const result = await this.getHashField(hashKey, key, options);
    if (result === null) return null;

    return TypeCompiler.Compile(schema).Decode(JSON.parse(result));
  }
}
