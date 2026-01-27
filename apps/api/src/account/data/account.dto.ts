import { type Static, t } from 'elysia';

export type Account = Static<typeof AccountDTO>;

export const AccountDTO = t.Object({
  id: t.String({ format: 'uuid' }),
  username: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  deletedAt: t.Nullable(t.Date()),
});
