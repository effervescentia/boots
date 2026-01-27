import { type Static, t } from 'elysia';
import { FamilyRole } from './family-role.enum';

export type FamilyInviteData = Static<typeof FamilyInviteDataDTO>;

export const FamilyInviteDataDTO = t.Object({
  familyID: t.String({ format: 'uuid' }),
  role: t.Optional(t.Enum(FamilyRole)),
});
