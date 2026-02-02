import { DataService } from '@api/global/data.service';
import { HeartbeatExpiredAlertDB } from '@api/heartbeat/data/heartbeat-expired-alert.db';
import { NotifyService } from '@api/notify/notify.service';
import { insertOne } from '@bltx/db';
import { eq, type InferInsertModel } from 'drizzle-orm';
import { omit } from 'radashi';
import { match, P } from 'ts-pattern';
import { AlertDB } from './data/alert.db';
import type { Alert } from './data/alert.dto';
import type { AlertData, AlertDataDB } from './data/alert-data.interface';
import { AlertType } from './data/alert-type.enum';

type AlertTarget = { familyID: string } | { networkID: string };

export class AlertService extends DataService {
  private static readonly ALERTS: AlertType[] = Object.values(AlertType);

  private static formatAlert(alert: Alert & { [Type in AlertType]: Omit<AlertData<Type>, 'type'> | null }) {
    let data: AlertData | null = null;

    for (const type of AlertService.ALERTS) {
      if (alert[type]) {
        data = { ...alert[type], type };
        break;
      }
    }

    return {
      ...omit(alert, AlertService.ALERTS),
      data: data!,
    };
  }

  async create(
    target: AlertTarget,
    type: AlertType,
    data: Omit<InferInsertModel<AlertDataDB<typeof type>>, 'alertID'>,
  ) {
    const alert = await this.transaction(async (tx) => {
      const alert = await insertOne(tx, AlertDB, target);

      if (type === AlertType.HEARTBEAT_EXPIRED) {
        await insertOne(tx, HeartbeatExpiredAlertDB, { ...data, alertID: alert.id });
      }

      return alert;
    });

    const topic = match(target)
      .with({ familyID: P.select(P.string) }, (familyID) => `family:${familyID}`)
      .with({ networkID: P.select(P.string) }, (networkID) => `network:${networkID}`)
      .exhaustive();

    await new NotifyService().sendAlert(topic, alert);

    return alert;
  }

  async getDetails(alertID: string) {
    const alert = await this.db.query.AlertDB.findFirst({
      where: eq(AlertDB.id, alertID),
      with: Object.fromEntries(AlertService.ALERTS.map((type) => [type, true])) as Record<AlertType, true>,
    });
    if (!alert) return null;

    return AlertService.formatAlert(alert);
  }

  async getMany(target: AlertTarget) {
    const query = match(target)
      .with({ familyID: P.select(P.string) }, (familyID) => eq(AlertDB.familyID, familyID))
      .with({ networkID: P.select(P.string) }, (networkID) => eq(AlertDB.networkID, networkID))
      .exhaustive();

    return this.db.query.AlertDB.findMany({
      where: query,
      with: Object.fromEntries(AlertService.ALERTS.map((type) => [type, true])) as Record<AlertType, true>,
    }).then((alerts) => alerts.map((alert) => AlertService.formatAlert(alert)));
  }
}
