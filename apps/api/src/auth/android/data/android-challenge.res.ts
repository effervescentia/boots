import { type Static, t } from 'elysia';

export type AndroidChallenge = Static<typeof AndroidChallengeResponse>;

export const AndroidChallengeResponse = t.Object({
  challenge: t.String(),
});
