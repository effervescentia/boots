import { createRouter, defineRoute } from 'type-route';

export const { RouteProvider, useRoute, routes } = createRouter({
  home: defineRoute('/'),

  fingerprint: defineRoute('/fingerprint'),

  signup: defineRoute('/signup'),

  login: defineRoute('/login'),
});
