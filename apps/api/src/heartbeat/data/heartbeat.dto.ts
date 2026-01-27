import { type Static, t } from 'elysia';

export type Heartbeat = Static<typeof HeartbeatDTO>;

export const HeartbeatDTO = t.Object({
  id: t.String({ format: 'uuid' }),
  accountID: t.String({ format: 'uuid' }),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});
