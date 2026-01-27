import { type Static, t } from 'elysia';

export type FamilyInvite = Static<typeof FamilyInviteResponse>;

export const FamilyInviteResponse = t.Object({
  inviteID: t.String(),
});
