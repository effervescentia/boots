import { type Static, t } from 'elysia';
import { NetworkRole } from './network-role.enum';

export type CreateNetworkInvite = Static<typeof CreateNetworkInviteRequest>;

export const CreateNetworkInviteRequest = t.Object({
  role: t.Optional(t.Enum(NetworkRole)),
});
