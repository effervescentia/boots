import type { AnyElysia, ElysiaConfig } from 'elysia';
import Elysia from 'elysia';

export class ElysiaCommand<Module extends AnyElysia> {
  constructor(
    private readonly module: Module,
    private readonly config?: ElysiaConfig<string>,
  ) {}

  async run(callback: (param: Module['decorator']) => Promise<unknown>) {
    const app = new Elysia(this.config).use(this.module).use(async (app) => {
      await callback(app.decorator);
      return app;
    });

    await app.modules;

    process.exit(0);
  }
}
