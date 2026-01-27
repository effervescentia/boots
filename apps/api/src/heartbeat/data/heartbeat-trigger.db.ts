import { FamilyDB } from '@api/family/data/family.db';
import { NetworkDB } from '@api/network/data/network.db';
import { uuidV7 } from '@bltx/db';
import { relations } from 'drizzle-orm';
import { index, integer, pgTable, unique } from 'drizzle-orm/pg-core';
import { HeartbeatDB } from './heartbeat.db';

export const HeartbeatTriggerDB = pgTable(
  'heartbeat_trigger',
  {
    heartbeatID: uuidV7('heartbeat_id')
      .references(() => HeartbeatDB.id, { onDelete: 'cascade' })
      .notNull(),
    /** @unit minutes */
    ttl: integer('ttl').notNull(),
    familyID: uuidV7('family_id').references(() => FamilyDB.id, { onDelete: 'cascade' }),
    networkID: uuidV7('network_id').references(() => NetworkDB.id, { onDelete: 'cascade' }),
  },
  (t) => [unique().on(t.heartbeatID, t.familyID, t.networkID), index().on(t.heartbeatID)],
);

export const HeartbeatTriggerRelations = relations(HeartbeatTriggerDB, ({ one }) => ({
  heartbeat: one(HeartbeatDB, { fields: [HeartbeatTriggerDB.heartbeatID], references: [HeartbeatDB.id] }),
  family: one(FamilyDB, { fields: [HeartbeatTriggerDB.familyID], references: [FamilyDB.id] }),
  network: one(NetworkDB, { fields: [HeartbeatTriggerDB.networkID], references: [NetworkDB.id] }),
}));
