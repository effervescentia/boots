import type { DB } from '@api/db/db.types';
import { DataService } from '@api/global/data.service';
import { RedisService } from '@api/redis/redis.service';
import { insertOne, updateOne } from '@bltx/db';
import type { RedisClient } from 'bun';
import { addSeconds } from 'date-fns';
import { and, eq } from 'drizzle-orm';
import type { CreateNetwork } from './data/create-network.req';
import type { CreateNetworkInvite } from './data/create-network-invite.req';
import { NetworkDB } from './data/network.db';
import type { NetworkInvite } from './data/network-invite.res';
import { NetworkInviteDataDTO } from './data/network-invite-data.dto';
import { NetworkInviteRecordDB } from './data/network-invite-record.db';
import { NetworkMemberDB } from './data/network-member.db';
import type { PatchNetwork } from './data/patch-network.req';
import { NETWORK_INVITE_TTL } from './network.const';

export class NetworkService extends DataService {
  public static readonly NETWORK_INVITE = 'network:invite';

  private readonly redis: RedisService;

  constructor(db: DB, redis: RedisClient) {
    super(db);

    this.redis = new RedisService(redis);
  }

  async create(accountID: string, data: CreateNetwork) {
    return this.transaction(async (tx) => {
      const network = await insertOne(tx, NetworkDB, data);
      await insertOne(tx, NetworkMemberDB, { accountID, networkID: network.id });

      return network;
    });
  }

  async patch(networkID: string, data: PatchNetwork) {
    return updateOne(this.db, NetworkDB, eq(NetworkDB.id, networkID), data);
  }

  async delete(networkID: string) {
    await this.db.delete(NetworkDB).where(eq(NetworkDB.id, networkID));
  }

  async getMembership(networkID: string, accountID: string) {
    return this.db.query.NetworkMemberDB.findFirst({
      where: and(eq(NetworkMemberDB.networkID, networkID), eq(NetworkMemberDB.accountID, accountID)),
      with: { network: true },
      columns: { role: true },
    });
  }

  async deleteMember(networkID: string, accountID: string) {
    await this.db
      .delete(NetworkMemberDB)
      .where(and(eq(NetworkMemberDB.networkID, networkID), eq(NetworkMemberDB.accountID, accountID)));

    const memberCount = await this.db.$count(NetworkMemberDB, eq(NetworkMemberDB.networkID, networkID));
    if (!memberCount) {
      // delete network when no members remain
      await this.delete(networkID);
    }
  }

  async createInvite(networkID: string, accountID: string, data: CreateNetworkInvite): Promise<NetworkInvite> {
    const inviteID = Bun.randomUUIDv7();

    await this.redis.setTypedHashField(
      NetworkInviteDataDTO,
      NetworkService.NETWORK_INVITE,
      inviteID,
      { ...data, networkID, invitedBy: accountID },
      { ttl: NETWORK_INVITE_TTL },
    );

    return {
      inviteID,
      expiresAt: addSeconds(new Date(), NETWORK_INVITE_TTL),
    };
  }

  async acceptInvite(accountID: string, inviteID: string) {
    const invite = await this.redis.getTypedHashField(NetworkInviteDataDTO, NetworkService.NETWORK_INVITE, inviteID, {
      delete: true,
    });

    await this.transaction(async (tx) => {
      await insertOne(tx, NetworkMemberDB, {
        accountID,
        networkID: invite.networkID,
        role: invite.role,
      });
      await insertOne(tx, NetworkInviteRecordDB, {
        networkID: invite.networkID,
        invitedID: accountID,
        invitedBy: invite.invitedBy,
      });
    });

    return invite.networkID;
  }
}
