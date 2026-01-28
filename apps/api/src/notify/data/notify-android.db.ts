import { AccountDB } from '@api/account/data/account.db';
import { timestamps, uuidV7 } from '@bltx/db';
import { relations } from 'drizzle-orm';
import { index, pgTable, text } from 'drizzle-orm/pg-core';

export const NotifyAndroidDB = pgTable(
  'notify_android',
  {
    accountID: uuidV7('account_id')
      .references(() => AccountDB.id)
      .unique()
      .notNull(),
    fcmToken: text('fcm_token').notNull(),
    ...timestamps,
  },
  (t) => [index().on(t.accountID)],
);

export const NotifyAndroidRelations = relations(NotifyAndroidDB, ({ one }) => ({
  account: one(AccountDB, { fields: [NotifyAndroidDB.accountID], references: [AccountDB.id] }),
}));
