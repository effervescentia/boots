import { EnvironmentGlobal } from '@api/env/env.global';
import Elysia from 'elysia';
import { FirebaseGlobal } from './firebase.global';

export const FirebasePlugin = new Elysia({ name: 'plugin.firebase' }).use(async (app) => {
  FirebaseGlobal.init(EnvironmentGlobal.data);
  return app;
});
