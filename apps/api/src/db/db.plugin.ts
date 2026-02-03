import { EnvironmentPlugin } from '@api/env/env.plugin';
import Elysia from 'elysia';
import { DatabaseGlobal } from './db.global';

export const DatabasePlugin = new Elysia({ name: 'plugin.database' }).use(EnvironmentPlugin).use(async (app) => {
  await DatabaseGlobal.init(app.decorator.env);
  return app;
});
