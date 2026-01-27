import { createdTimestamp, typedJSONB, uuidV7 } from '@bltx/db';
import { relations } from 'drizzle-orm';
import { pgTable } from 'drizzle-orm/pg-core';
import { NetworkDB } from './network.db';
import { NetworkAuditLogDTO } from './network-audit-log.dto';

const NetworkAuditLog = typedJSONB(NetworkAuditLogDTO);

export const NetworkAuditLogDB = pgTable('network_audit_log', {
  networkID: uuidV7('network_id')
    .references(() => NetworkDB.id, { onDelete: 'cascade' })
    .notNull(),
  data: NetworkAuditLog('data').notNull(),
  ...createdTimestamp,
});

export const NetworkAuditLogRelations = relations(NetworkAuditLogDB, ({ one }) => ({
  network: one(NetworkDB, { fields: [NetworkAuditLogDB.networkID], references: [NetworkDB.id] }),
}));
