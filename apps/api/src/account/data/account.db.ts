import { AuthCredentialDB } from '@api/auth/data/auth-credential.db';
import { id, timestamps } from '@bltx/db';
import { relations } from 'drizzle-orm';
import { boolean, pgTable, text } from 'drizzle-orm/pg-core';

export const AccountDB = pgTable('account', {
  id: id('id'),
  username: text('username').notNull(),
  isChild: boolean('is_child').default(false).notNull(),
  ...timestamps,
});

export const AccountRelations = relations(AccountDB, ({ many }) => ({
  credentials: many(AuthCredentialDB),
  // aliases: many(AccountAliasDB),
  // memos: many(MemoDB),
  // boosts: many(MemoBoostDB),
}));
