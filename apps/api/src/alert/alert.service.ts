import { DataService } from '@api/global/data.service';
import { HeartbeatExpiredAlertDB } from '@api/heartbeat/data/heartbeat-expired-alert.db';
import { insertOne } from '@bltx/db';
import { eq, type InferInsertModel } from 'drizzle-orm';
import { AlertDB } from './data/alert.db';
import type { AlertDataDB } from './data/alert-data.interface';
import { AlertType } from './data/alert-type.enum';

export class AlertService extends DataService {
  async create(
    target: { familyID: string } | { networkID: string },
    type: AlertType,
    data: Omit<InferInsertModel<AlertDataDB<typeof type>>, 'alertID'>,
  ) {
    return this.transaction(async (tx) => {
      const alert = await insertOne(tx, AlertDB, target);

      if (type === AlertType.HEARTBEAT_EXPIRED) {
        await insertOne(tx, HeartbeatExpiredAlertDB, { ...data, alertID: alert.id });
      }

      return alert;
    });
  }

  async delete(alertID: string) {
    await this.db.delete(AlertDB).where(eq(AlertDB.id, alertID));
  }
}
