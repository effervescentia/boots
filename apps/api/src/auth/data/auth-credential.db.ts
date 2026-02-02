import { AccountDB } from '@api/account/data/account.db';
import { timestamps, uuidV7 } from '@bltx/db';
import { relations } from 'drizzle-orm';
import { index, pgTable, text } from 'drizzle-orm/pg-core';
import { AuthAndroidCredentialDB } from '../android/data/auth-android-credential.db';
import { AuthWebCredentialDB } from '../web/data/auth-web-credential.db';

export const AuthCredentialDB = pgTable(
  'auth_credential',
  {
    id: text('id').primaryKey(),
    accountID: uuidV7('account_id')
      .references(() => AccountDB.id, { onDelete: 'cascade' })
      .notNull(),

    ...timestamps,
  },
  (t) => [index().on(t.accountID)],
);

export const AuthCredentialRelations = relations(AuthCredentialDB, ({ one }) => ({
  account: one(AccountDB, { fields: [AuthCredentialDB.accountID], references: [AccountDB.id] }),
  web: one(AuthWebCredentialDB),
  android: one(AuthAndroidCredentialDB),
}));
