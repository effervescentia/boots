import type { DB } from '@api/db/db.types';
import { EnvironmentGlobal } from '@api/env/env.global';
import { FirebaseGlobal } from '@api/firebase/firebase.global';
import { RedisGlobal } from '@api/redis/redis.global';
import { transaction } from '@bltx/db';

export class DataService {
  protected readonly env = EnvironmentGlobal.data;
  protected readonly redis = RedisGlobal.service;
  protected readonly firebase = FirebaseGlobal.client;

  constructor(protected readonly db: DB) {}

  protected get transaction() {
    return transaction(this.db);
  }
}
