import { AuthCredentialDB } from '@api/auth/data/auth-credential.db';
import { bytea } from '@api/db/utils/column.util';
import { nativeEnum, timestamps } from '@bltx/db';
import { relations } from 'drizzle-orm';
import { boolean, index, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { AuthTransportEnum } from '../../data/auth-transport.enum';
import { AuthDeviceType } from './auth-device-type.enum';

export const AuthDeviceTypeEnum = nativeEnum('auth_device_type', AuthDeviceType);

export const AuthAndroidCredentialDB = pgTable(
  'auth_android_credential',
  {
    credentialID: text('credential_id')
      .references(() => AuthCredentialDB.id, { onDelete: 'cascade' })
      .unique()
      .notNull(),
    publicKey: bytea('public_key').notNull(),
    webAuthnUserID: text('web_authn_user_id').notNull(),
    counter: integer('counter').notNull(),
    transports: AuthTransportEnum('transports').array().notNull(),
    deviceType: AuthDeviceTypeEnum('device_type').notNull(),
    isBackedUp: boolean('is_backed_up').default(false).notNull(),

    ...timestamps,
  },
  (t) => [index().on(t.credentialID)],
);

export const AuthAndroidCredentialRelations = relations(AuthAndroidCredentialDB, ({ one }) => ({
  credential: one(AuthCredentialDB, {
    fields: [AuthAndroidCredentialDB.credentialID],
    references: [AuthCredentialDB.id],
  }),
}));
