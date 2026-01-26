import { id, timestamps } from '@bltx/db';
import { relations } from 'drizzle-orm';
import { pgTable, text } from 'drizzle-orm/pg-core';
import { NetworkMemberDB } from './network-member.db';

export const NetworkDB = pgTable('network', {
  id: id('id'),
  name: text('name').notNull(),
  ...timestamps,
});

export const NetworkRelations = relations(NetworkDB, ({ many }) => ({
  members: many(NetworkMemberDB),
}));
