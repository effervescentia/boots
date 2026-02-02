import { type Static, t } from 'elysia';

export type AndroidChallengeDetails = Static<typeof AndroidChallengeDetailsDTO>;

export const AndroidChallengeDetailsDTO = t.Object({
  challenge: t.String(),
  webAuthnUserID: t.String(),
});
