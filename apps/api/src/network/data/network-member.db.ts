import { AccountDB } from '@api/account/data/account.db';
import { nativeEnum, timestamps, uuidV7 } from '@bltx/db';
import { relations } from 'drizzle-orm';
import { pgTable } from 'drizzle-orm/pg-core';
import { NetworkDB } from './network.db';
import { NetworkRole } from './network-role.enum';

export const NetworkRoleEnum = nativeEnum('network_role', NetworkRole);

export const NetworkMemberDB = pgTable('network_member', {
  accountID: uuidV7('account_id')
    .references(() => AccountDB.id, { onDelete: 'cascade' })
    .notNull(),
  networkID: uuidV7('network_id')
    .references(() => NetworkDB.id, { onDelete: 'cascade' })
    .notNull(),
  role: NetworkRoleEnum('role'),
  ...timestamps,
});

export const NetworkMemberRelations = relations(NetworkMemberDB, ({ one }) => ({
  account: one(AccountDB, { fields: [NetworkMemberDB.accountID], references: [AccountDB.id] }),
  network: one(NetworkDB, { fields: [NetworkMemberDB.networkID], references: [NetworkDB.id] }),
}));
