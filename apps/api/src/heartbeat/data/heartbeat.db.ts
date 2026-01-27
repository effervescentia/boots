import { AccountDB } from '@api/account/data/account.db';
import { id, timestamps, uuidV7 } from '@bltx/db';
import { relations } from 'drizzle-orm';
import { index, pgTable } from 'drizzle-orm/pg-core';
import { HeartbeatAlertDB } from './heartbeat-alert.db';

export const HeartbeatDB = pgTable(
  'heartbeat',
  {
    id: id('id'),
    accountID: uuidV7('account_id')
      .references(() => AccountDB.id, { onDelete: 'cascade' })
      .unique()
      .notNull(),
    ...timestamps,
  },
  (t) => [index().on(t.accountID)],
);

export const HeartbeatRelations = relations(HeartbeatDB, ({ one, many }) => ({
  account: one(AccountDB, { fields: [HeartbeatDB.accountID], references: [AccountDB.id] }),
  alerts: many(HeartbeatAlertDB),
}));
