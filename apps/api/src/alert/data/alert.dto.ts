import { type Static, t } from 'elysia';

export type Alert = Static<typeof AlertDTO>;

export const AlertDTO = t.Object({
  id: t.String({ format: 'uuid' }),
  familyID: t.Nullable(t.String({ format: 'uuid' })),
  networkID: t.Nullable(t.String({ format: 'uuid' })),
  createdAt: t.Date(),
});
