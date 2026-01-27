import { type Static, t } from 'elysia';

export type NetworkInvite = Static<typeof NetworkInviteResponse>;

export const NetworkInviteResponse = t.Object({
  inviteID: t.String(),
  expiresAt: t.Date(),
});
