import { type Static, t } from 'elysia';

export type Family = Static<typeof FamilyDTO>;

export const FamilyDTO = t.Object({
  id: t.String({ format: 'uuid' }),
  name: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});
