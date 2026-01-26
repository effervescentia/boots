import { DataService } from '@api/global/data.service';
import { insertOne, updateOne } from '@bltx/db';
import { and, eq } from 'drizzle-orm';
import type { CreateNetwork } from './data/create-network.req';
import { NetworkDB } from './data/network.db';
import { NetworkMemberDB } from './data/network-member.db';
import type { PatchNetwork } from './data/patch-network.req';

export class NetworkService extends DataService {
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
}
