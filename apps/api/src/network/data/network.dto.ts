import { type Static, t } from 'elysia';

export type Network = Static<typeof NetworkDTO>;

export const NetworkDTO = t.Object({
  id: t.String({ format: 'uuid' }),
  name: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});
