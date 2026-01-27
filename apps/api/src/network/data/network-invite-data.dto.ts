import { type Static, t } from 'elysia';
import { NetworkRole } from './network-role.enum';

export type NetworkInviteData = Static<typeof NetworkInviteDataDTO>;

export const NetworkInviteDataDTO = t.Object({
  networkID: t.String({ format: 'uuid' }),
  invitedBy: t.String({ format: 'uuid' }),
  role: t.Optional(t.Enum(NetworkRole)),
});
