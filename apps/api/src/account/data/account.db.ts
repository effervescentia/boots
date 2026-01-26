import { AuthCredentialDB } from '@api/auth/data/auth-credential.db';
import { FamilyMemberDB } from '@api/family/data/family-member.db';
import { NetworkMemberDB } from '@api/network/data/network-member.db';
import { id, timestamps } from '@bltx/db';
import { relations } from 'drizzle-orm';
import { pgTable, text } from 'drizzle-orm/pg-core';

export const AccountDB = pgTable('account', {
  id: id('id'),
  username: text('username').notNull(),
  ...timestamps,
});

export const AccountRelations = relations(AccountDB, ({ many }) => ({
  families: many(FamilyMemberDB),
  networks: many(NetworkMemberDB),
  credentials: many(AuthCredentialDB),
}));
