import { type Environment, EnvironmentDTO } from '@api/app/app.env';
import { createEnvironmentPlugin } from '@bltx/core';

// biome-ignore lint/complexity/noStaticOnlyClass: global
export class EnvironmentGlobal {
  static data: Environment;

  static init() {
    if (EnvironmentGlobal.data) return;

    EnvironmentGlobal.data = createEnvironmentPlugin(EnvironmentDTO).decorator.env();
  }
}
