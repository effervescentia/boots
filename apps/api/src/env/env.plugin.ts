import Elysia from 'elysia';
import { EnvironmentGlobal } from './env.global';

export const EnvironmentPlugin = new Elysia({ name: 'plugin.environment' }).use((app) => {
  EnvironmentGlobal.init();
  return app.decorate({ env: EnvironmentGlobal.data });
});
