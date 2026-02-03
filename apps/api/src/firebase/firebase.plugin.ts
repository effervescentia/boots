import { EnvironmentPlugin } from '@api/env/env.plugin';
import Elysia from 'elysia';
import { FirebaseGlobal } from './firebase.global';

export const FirebasePlugin = new Elysia({ name: 'plugin.firebase' }).use(EnvironmentPlugin).use(async (app) => {
  FirebaseGlobal.init(app.decorator.env);
  return app;
});
