import { AccountDB } from '@api/account/data/account.db';
import { createdTimestamp, uuidV7 } from '@bltx/db';
import { relations } from 'drizzle-orm';
import { pgTable } from 'drizzle-orm/pg-core';
import { NetworkDB } from './network.db';

export const NetworkInviteRecordDB = pgTable('network_invite_record', {
  invitedID: uuidV7('invited_id').notNull(),
  invitedBy: uuidV7('invited_by').notNull(),
  networkID: uuidV7('network_id')
    .references(() => NetworkDB.id, { onDelete: 'cascade' })
    .notNull(),
  ...createdTimestamp,
});

export const NetworkInviteRecordRelations = relations(NetworkInviteRecordDB, ({ one }) => ({
  invitedAccount: one(AccountDB, { fields: [NetworkInviteRecordDB.invitedID], references: [AccountDB.id] }),
  invitedByAccount: one(AccountDB, { fields: [NetworkInviteRecordDB.invitedID], references: [AccountDB.id] }),
  network: one(NetworkDB, { fields: [NetworkInviteRecordDB.networkID], references: [NetworkDB.id] }),
}));
