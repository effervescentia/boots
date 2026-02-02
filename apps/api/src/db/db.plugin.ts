import { EnvironmentGlobal } from '@api/env/env.global';
import Elysia from 'elysia';
import { DatabaseGlobal } from './db.global';

export const DatabasePlugin = new Elysia({ name: 'plugin.database' }).use(async (app) => {
  await DatabaseGlobal.init(EnvironmentGlobal.data);
  return app;
});
