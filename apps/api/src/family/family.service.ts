import { FamilyMemberDB } from '@api/db/db.schema';
import { DataService } from '@api/global/data.service';
import { insertOne, updateOne } from '@bltx/db';
import { and, eq } from 'drizzle-orm';
import type { CreateFamily } from './data/create-family.req';
import { FamilyDB } from './data/family.db';
import { FamilyRole } from './data/family-role.enum';
import type { PatchFamily } from './data/patch-family.req';

export class FamilyService extends DataService {
  async create(accountID: string, data: CreateFamily) {
    return this.transaction(async (tx) => {
      const family = await insertOne(tx, FamilyDB, data);
      await insertOne(tx, FamilyMemberDB, { accountID, familyID: family.id, role: FamilyRole.ADULT });

      return family;
    });
  }

  async patch(familyID: string, data: PatchFamily) {
    return updateOne(this.db, FamilyDB, eq(FamilyDB.id, familyID), data);
  }

  async delete(familyID: string) {
    await this.db.delete(FamilyDB).where(eq(FamilyDB.id, familyID));
  }

  async getMembership(familyID: string, accountID: string) {
    return this.db.query.FamilyMemberDB.findFirst({
      where: and(eq(FamilyMemberDB.familyID, familyID), eq(FamilyMemberDB.accountID, accountID)),
      with: { family: true },
      columns: { role: true },
    });
  }

  async deleteMember(familyID: string, accountID: string) {
    await this.db
      .delete(FamilyMemberDB)
      .where(and(eq(FamilyMemberDB.familyID, familyID), eq(FamilyMemberDB.accountID, accountID)));

    const memberCount = await this.db.$count(FamilyMemberDB, eq(FamilyMemberDB.familyID, familyID));
    if (!memberCount) {
      // delete family when no members remain
      await this.delete(familyID);
    }
  }
}
