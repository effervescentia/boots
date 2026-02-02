import type { Alert } from '@api/alert/data/alert.dto';
import { FirebaseGlobal } from '@api/firebase/firebase.global';

export class NotifyService {
  private readonly firebase = FirebaseGlobal.client;

  async sendAlert(topic: string, alert: Alert) {
    await this.firebase.sendMessage(topic, { type: 'alert', data: JSON.stringify(alert) });
  }
}
