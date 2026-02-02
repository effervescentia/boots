import { type Static, t } from 'elysia';

export type WebChallenge = Static<typeof WebChallengeResponse>;

export const WebChallengeResponse = t.Object({
  challenge: t.String(),
});
