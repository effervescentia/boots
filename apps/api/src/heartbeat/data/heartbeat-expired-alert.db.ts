import { AlertDB } from '@api/alert/data/alert.db';
import { HeartbeatDB } from '@api/heartbeat/data/heartbeat.db';
import { createdTimestamp, uuidV7 } from '@bltx/db';
import { relations } from 'drizzle-orm';
import { index, pgTable, unique } from 'drizzle-orm/pg-core';

export const HeartbeatExpiredAlertDB = pgTable(
  'heartbeat_expired_alert',
  {
    alertID: uuidV7('alert_id')
      .references(() => AlertDB.id, { onDelete: 'cascade' })
      .notNull(),
    heartbeatID: uuidV7('heartbeat_id')
      .references(() => HeartbeatDB.id, { onDelete: 'cascade' })
      .notNull(),
    ...createdTimestamp,
  },
  (t) => [unique().on(t.alertID, t.heartbeatID), index().on(t.alertID), index().on(t.heartbeatID)],
);

export const HeartbeatExpiredAlertRelations = relations(HeartbeatExpiredAlertDB, ({ one }) => ({
  alert: one(AlertDB, { fields: [HeartbeatExpiredAlertDB.alertID], references: [AlertDB.id] }),
  heartbeat: one(HeartbeatDB, { fields: [HeartbeatExpiredAlertDB.heartbeatID], references: [HeartbeatDB.id] }),
}));
