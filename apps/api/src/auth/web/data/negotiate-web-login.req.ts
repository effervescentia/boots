import { type Static, t } from 'elysia';

export type NegotiateWebLogin = Static<typeof NegotiateWebLoginRequest>;

export const NegotiateWebLoginRequest = t.Object({});
