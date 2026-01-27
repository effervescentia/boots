import { type Static, t } from 'elysia';
import { MAX_HEARTBEAT_ALERTS } from '../heartbeat.const';

export type CreateHeartbeat = Static<typeof CreateHeartbeatRequest>;

const BaseAlert = t.Object({
  ttl: t.Integer({
    // 6 hours
    minimum: 360,
    // 7 days
    maximum: 10_080,
  }),
});

export const CreateHeartbeatRequest = t.Object({
  triggers: t.Array(
    t.Union([
      t.Composite([
        BaseAlert,
        t.Object({
          familyID: t.String({ format: 'uuid' }),
        }),
      ]),
      t.Composite([
        BaseAlert,
        t.Object({
          networkID: t.String({ format: 'uuid' }),
        }),
      ]),
    ]),
    {
      minItems: 1,
      maxItems: MAX_HEARTBEAT_ALERTS,
    },
  ),
});
