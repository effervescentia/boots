import { EnvironmentPlugin } from '@api/global/environment.plugin';
import { createDatabasePlugin } from '@bltx/db';
import * as schema from './db.schema';

export const DatabasePlugin = createDatabasePlugin({
  type: 'bun-sql',
  schema,
  env: EnvironmentPlugin,
  factory: (env) =>
    new Bun.SQL({
      hostname: env.POSTGRES_HOSTNAME,
      port: env.POSTGRES_PORT,
      database: env.POSTGRES_DATABASE,
      username: env.POSTGRES_USERNAME,
      password: env.POSTGRES_PASSWORD,
    }),
});
