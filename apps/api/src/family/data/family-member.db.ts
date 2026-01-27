import { AccountDB } from '@api/account/data/account.db';
import { nativeEnum, timestamps, uuidV7 } from '@bltx/db';
import { relations } from 'drizzle-orm';
import { index, pgTable, unique } from 'drizzle-orm/pg-core';
import { FamilyDB } from './family.db';
import { FamilyRole } from './family-role.enum';

export const FamilyRoleEnum = nativeEnum('family_role', FamilyRole);

export const FamilyMemberDB = pgTable(
  'family_member',
  {
    accountID: uuidV7('account_id')
      .references(() => AccountDB.id, { onDelete: 'cascade' })
      .notNull(),
    familyID: uuidV7('family_id')
      .references(() => FamilyDB.id, { onDelete: 'cascade' })
      .notNull(),
    role: FamilyRoleEnum('role').notNull(),
    ...timestamps,
  },
  (t) => [unique().on(t.accountID, t.familyID), index().on(t.accountID), index().on(t.familyID)],
);

export const FamilyMemberRelations = relations(FamilyMemberDB, ({ one }) => ({
  account: one(AccountDB, { fields: [FamilyMemberDB.accountID], references: [AccountDB.id] }),
  family: one(FamilyDB, { fields: [FamilyMemberDB.familyID], references: [FamilyDB.id] }),
}));
