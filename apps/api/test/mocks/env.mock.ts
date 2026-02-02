import type { Environment } from '@api/app/app.env';
import { EnvironmentGlobal } from '@api/env/env.global';

// biome-ignore lint/complexity/noStaticOnlyClass: global mock
export class EnvironmentMock {
  static init(env: Environment) {
    EnvironmentGlobal.data = env;
  }
}
