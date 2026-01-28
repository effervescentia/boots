import { EnvironmentPlugin } from '@api/global/environment.plugin';
import Elysia from 'elysia';
import { FirebaseClient } from './firebase.client';

export const FirebasePlugin = new Elysia({ name: 'plugin.firebase' }).use((app) => {
  const firebase = new FirebaseClient(EnvironmentPlugin.decorator.env());

  return app.decorate({ firebase: () => firebase });
});
