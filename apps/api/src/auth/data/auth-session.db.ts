import { timestamps } from '@bltx/db';
import { relations } from 'drizzle-orm';
import { index, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { AuthCredentialDB } from './auth-credential.db';

export const AuthSessionDB = pgTable(
  'auth_session',
  {
    id: serial('id').primaryKey(),
    credentialID: text('credential_id')
      .references(() => AuthCredentialDB.id, { onDelete: 'cascade' })
      .unique()
      .notNull(),
    ...timestamps,
  },
  (t) => [index().on(t.credentialID)],
);

export const AuthSessionRelations = relations(AuthSessionDB, ({ one }) => ({
  credential: one(AuthCredentialDB, { fields: [AuthSessionDB.credentialID], references: [AuthCredentialDB.id] }),
}));
