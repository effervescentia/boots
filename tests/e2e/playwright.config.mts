import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'dot',

  use: {
    baseURL: 'https://app.boots.localhost:1337',
    trace: process.env.CI ? 'on' : 'off',
  },
});
