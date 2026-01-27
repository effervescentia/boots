import { FamilyMemberDB } from '@api/db/db.schema';
import type { DB } from '@api/db/db.types';
import { DataService } from '@api/global/data.service';
import { RedisService } from '@api/redis/redis.service';
import { insertOne, updateOne } from '@bltx/db';
import type { RedisClient } from 'bun';
import { addSeconds } from 'date-fns';
import { and, eq } from 'drizzle-orm';
import type { CreateFamily } from './data/create-family.req';
import type { CreateFamilyInvite } from './data/create-family-invite.req';
import { FamilyDB } from './data/family.db';
import type { FamilyInvite } from './data/family-invite.res';
import { FamilyInviteDataDTO } from './data/family-invite-data.dto';
import { FamilyRole } from './data/family-role.enum';
import type { PatchFamily } from './data/patch-family.req';
import { FAMILY_INVITE_TTL } from './family.const';

export class FamilyService extends DataService {
  public static readonly FAMILY_INVITE = 'family:invite';

  private readonly redis: RedisService;

  constructor(db: DB, redis: RedisClient) {
    super(db);

    this.redis = new RedisService(redis);
  }

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

  async createInvite(familyID: string, data: CreateFamilyInvite): Promise<FamilyInvite> {
    const inviteID = Bun.randomUUIDv7();

    await this.redis.setTypedHashField(
      FamilyInviteDataDTO,
      FamilyService.FAMILY_INVITE,
      inviteID,
      { ...data, familyID },
      { ttl: FAMILY_INVITE_TTL },
    );

    return {
      inviteID,
      expiresAt: addSeconds(new Date(), FAMILY_INVITE_TTL),
    };
  }

  async acceptInvite(accountID: string, inviteID: string) {
    const invite = await this.redis.getTypedHashField(FamilyInviteDataDTO, FamilyService.FAMILY_INVITE, inviteID, {
      delete: true,
    });

    await insertOne(this.db, FamilyMemberDB, {
      accountID,
      familyID: invite.familyID,
      role: invite.role ?? FamilyRole.ADULT,
    });

    return invite.familyID;
  }
}
