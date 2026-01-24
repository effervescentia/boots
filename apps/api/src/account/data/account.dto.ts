import { type Static, t } from 'elysia';

export type Account = Static<typeof AccountDTO>;

export const AccountDTO = t.Object({
  id: t.String({ format: 'uuid' }),
  username: t.String(),
  isChild: t.Boolean(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});
