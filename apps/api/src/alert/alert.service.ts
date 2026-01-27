import { DataService } from '@api/global/data.service';
import { insertOne, updateOne } from '@bltx/db';
import { eq } from 'drizzle-orm';
import { AlertDB } from './data/alert.db';
import type { CreateAlert } from './data/create-alert.req';
import type { PatchAlert } from './data/patch-alert.req';

export class AlertService extends DataService {
  async create(data: CreateAlert) {
    return insertOne(this.db, AlertDB, data);
  }

  async patch(alertID: string, data: PatchAlert) {
    return updateOne(this.db, AlertDB, eq(AlertDB.id, alertID), data);
  }

  async delete(alertID: string) {
    await this.db.delete(AlertDB).where(eq(AlertDB.id, alertID));
  }
}
