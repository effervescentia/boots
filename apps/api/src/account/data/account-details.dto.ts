import { FamilyDTO } from '@api/family/data/family.dto';
import { FamilyRole } from '@api/family/data/family-role.enum';
import { NetworkDTO } from '@api/network/data/network.dto';
import { NetworkRole } from '@api/network/data/network-role.enum';
import { type Static, t } from 'elysia';
import { AccountDTO } from './account.dto';

export type AccountDetails = Static<typeof AccountDetailsDTO>;

export const AccountDetailsDTO = t.Composite([
  AccountDTO,
  t.Object({
    families: t.Array(t.Composite([FamilyDTO, t.Object({ role: t.Enum(FamilyRole) })])),
    networks: t.Array(t.Composite([NetworkDTO, t.Object({ role: t.Nullable(t.Enum(NetworkRole)) })])),
  }),
]);
