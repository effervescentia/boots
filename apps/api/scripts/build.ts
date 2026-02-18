import { Glob } from 'bun';

const cronFiles = Array.from(new Glob('./src/**/*.cron.ts').scanSync('.'));

await Bun.build({
  entrypoints: ['./src/main.ts', ...cronFiles],
  outdir: './build',
  target: 'bun',
});
