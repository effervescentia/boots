import { id, timestamps } from '@bltx/db';
import { relations } from 'drizzle-orm';
import { pgTable, text } from 'drizzle-orm/pg-core';
import { FamilyMemberDB } from './family-member.db';

export const FamilyDB = pgTable('family', {
  id: id('id'),
  name: text('name').notNull(),
  ...timestamps,
});

export const FamilyRelations = relations(FamilyDB, ({ many }) => ({
  members: many(FamilyMemberDB),
}));
