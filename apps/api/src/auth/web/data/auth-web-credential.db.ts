import { AuthCredentialDB } from '@api/auth/data/auth-credential.db';
import { AuthTransportEnum } from '@api/auth/data/auth-transport.db';
import { nativeEnum, timestamps } from '@bltx/db';
import { relations } from 'drizzle-orm';
import { index, pgTable, text } from 'drizzle-orm/pg-core';
import { AuthAlgorithm } from '../../data/auth-algorithm.enum';

export const AuthAlgorithmEnum = nativeEnum('auth_algorithm', AuthAlgorithm);

export const AuthWebCredentialDB = pgTable(
  'auth_web_credential',
  {
    credentialID: text('credential_id')
      .references(() => AuthCredentialDB.id, { onDelete: 'cascade' })
      .unique()
      .notNull(),
    publicKey: text('public_key').notNull(),
    algorithm: AuthAlgorithmEnum('algorithm').notNull(),
    transports: AuthTransportEnum('transports').array().notNull(),

    ...timestamps,
  },
  (t) => [index().on(t.credentialID)],
);

export const AuthWebCredentialRelations = relations(AuthWebCredentialDB, ({ one }) => ({
  credential: one(AuthCredentialDB, { fields: [AuthWebCredentialDB.credentialID], references: [AuthCredentialDB.id] }),
}));
