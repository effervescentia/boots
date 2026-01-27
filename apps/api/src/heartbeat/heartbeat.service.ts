import { ConflictError } from '@api/global/conflict.error';
import { DataService } from '@api/global/data.service';
import { insertOne } from '@bltx/db';
import { eq } from 'drizzle-orm';
import type { CreateHeartbeat } from './data/create-heartbeat.req';
import { HeartbeatDB } from './data/heartbeat.db';
import { HeartbeatAlertDB } from './data/heartbeat-alert.db';

export class HeartbeatService extends DataService {
  async create(accountID: string, data: CreateHeartbeat) {
    const heartbeatCount = await this.db.$count(HeartbeatDB, eq(HeartbeatDB.accountID, accountID));
    if (heartbeatCount) throw new ConflictError('Each account can only have one Heartbeat configured');

    return this.transaction(async (tx) => {
      const heartbeat = await insertOne(tx, HeartbeatDB, { accountID });

      await tx.insert(HeartbeatAlertDB).values(data.alerts.map((alert) => ({ ...alert, heartbeatID: heartbeat.id })));

      return heartbeat;
    });
  }

  async delete(heartbeatID: string) {
    await this.db.delete(HeartbeatDB).where(eq(HeartbeatDB.id, heartbeatID));
  }
}
