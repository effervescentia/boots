import { AlertService } from '@api/alert/alert.service';
import { AlertDB } from '@api/alert/data/alert.db';
import { AlertType } from '@api/alert/data/alert-type.enum';
import type { DB } from '@api/db/db.types';
import type { FirebaseClient } from '@api/firebase/firebase.client';
import { ConflictError } from '@api/global/conflict.error';
import { DataService } from '@api/global/data.service';
import { insertOne } from '@bltx/db';
import { and, eq, getTableColumns, isNull, lte, or, sql } from 'drizzle-orm';
import { match, P } from 'ts-pattern';
import type { CreateHeartbeat } from './data/create-heartbeat.req';
import { HeartbeatDB } from './data/heartbeat.db';
import { HeartbeatExpiredAlertDB } from './data/heartbeat-expired-alert.db';
import { HeartbeatTriggerDB } from './data/heartbeat-trigger.db';

export class HeartbeatService extends DataService {
  constructor(
    db: DB,
    private readonly firebase: FirebaseClient,
  ) {
    super(db);
  }

  async create(accountID: string, data: CreateHeartbeat) {
    const heartbeatCount = await this.db.$count(HeartbeatDB, eq(HeartbeatDB.accountID, accountID));
    if (heartbeatCount) throw new ConflictError('Each account can only have one Heartbeat configured');

    return this.transaction(async (tx) => {
      const heartbeat = await insertOne(tx, HeartbeatDB, { accountID });

      await tx
        .insert(HeartbeatTriggerDB)
        .values(data.triggers.map((alert) => ({ ...alert, heartbeatID: heartbeat.id })));

      return heartbeat;
    });
  }

  async alertExpired() {
    const now = new Date();
    const alert = this.db
      .select({ ...getTableColumns(AlertDB), heartbeatID: HeartbeatExpiredAlertDB.heartbeatID })
      .from(AlertDB)
      .innerJoin(HeartbeatExpiredAlertDB, eq(HeartbeatExpiredAlertDB.alertID, AlertDB.id))
      .as('alert');

    const triggers = await this.db
      .select(getTableColumns(HeartbeatTriggerDB))
      .from(HeartbeatTriggerDB)
      .innerJoin(HeartbeatDB, eq(HeartbeatDB.id, HeartbeatTriggerDB.heartbeatID))
      .leftJoin(
        alert,
        and(
          eq(alert.heartbeatID, HeartbeatTriggerDB.heartbeatID),
          or(
            and(eq(alert.familyID, HeartbeatTriggerDB.familyID), isNull(alert.networkID)),
            and(eq(alert.networkID, HeartbeatTriggerDB.networkID), isNull(alert.familyID)),
          ),
        ),
      )
      .where(
        and(
          isNull(alert.id),
          lte(sql<Date>`${HeartbeatDB.updatedAt} + (${HeartbeatTriggerDB.ttl}::text || 'minutes')::interval`, now),
        ),
      );

    const alertService = new AlertService(this.db, this.firebase);

    for (const trigger of triggers) {
      const target = match(trigger)
        .with({ familyID: P.select(P.string) }, (familyID) => ({ familyID }))
        .with({ networkID: P.select(P.string) }, (networkID) => ({ networkID }))
        .otherwise(() => null);

      if (target) {
        await alertService.create(target, AlertType.HEARTBEAT_EXPIRED, {
          heartbeatID: trigger.heartbeatID,
        });
      }
    }

    console.log(`Created ${triggers.length} ${AlertType.HEARTBEAT_EXPIRED} alerts`);
  }
}
