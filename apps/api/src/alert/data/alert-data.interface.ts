import type { HeartbeatExpiredAlertDB } from '@api/heartbeat/data/heartbeat-expired-alert.db';
import type { InferSelectModel } from 'drizzle-orm';
import type { AlertType } from './alert-type.enum';

export type AlertDataDB<Type extends AlertType> = {
  [AlertType.HEARTBEAT_EXPIRED]: typeof HeartbeatExpiredAlertDB;
}[Type];

export type AlertData<Type extends AlertType = AlertType> = InferSelectModel<AlertDataDB<Type>> & { type: Type };
