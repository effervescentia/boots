import { FamilyDB } from '@api/family/data/family.db';
import { NetworkDB } from '@api/network/data/network.db';
import { createdTimestamp, id, uuidV7 } from '@bltx/db';
import { relations } from 'drizzle-orm';
import { pgTable } from 'drizzle-orm/pg-core';
import { HeartbeatExpiredAlertDB } from '../../heartbeat/data/heartbeat-expired-alert.db';
import { AlertType } from './alert-type.enum';

export const AlertDB = pgTable('alert', {
  id: id('id'),
  familyID: uuidV7('family_id').references(() => FamilyDB.id, { onDelete: 'cascade' }),
  networkID: uuidV7('network_id').references(() => NetworkDB.id, { onDelete: 'cascade' }),
  ...createdTimestamp,
});

export const AlertRelations = relations(AlertDB, ({ one }) => ({
  [AlertType.HEARTBEAT_EXPIRED]: one(HeartbeatExpiredAlertDB),
  family: one(FamilyDB, { fields: [AlertDB.familyID], references: [FamilyDB.id] }),
  network: one(NetworkDB, { fields: [AlertDB.networkID], references: [NetworkDB.id] }),
}));
