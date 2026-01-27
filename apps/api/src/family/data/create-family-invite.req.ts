import { type Static, t } from 'elysia';
import { FamilyRole } from './family-role.enum';

export type CreateFamilyInvite = Static<typeof CreateFamilyInviteRequest>;

export const CreateFamilyInviteRequest = t.Object({
  role: t.Optional(t.Enum(FamilyRole)),
});
