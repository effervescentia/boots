import type { Environment } from '@api/app/app.env';
import { drizzle } from 'drizzle-orm/bun-sql';
import * as schema from './db.schema';
import type { DB } from './db.types';

// biome-ignore lint/complexity/noStaticOnlyClass: global
export class DatabaseGlobal {
  static client: DB;

  static async init(env: Environment) {
    if (DatabaseGlobal.client) return;

    DatabaseGlobal.client = drizzle({
      schema,
      client: new Bun.SQL({
        hostname: env.POSTGRES_HOSTNAME,
        port: env.POSTGRES_PORT,
        database: env.POSTGRES_DATABASE,
        username: env.POSTGRES_USERNAME,
        password: env.POSTGRES_PASSWORD,
      }),
    });
  }
}
