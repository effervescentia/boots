import type { Alert } from '@api/alert/data/alert.dto';
import type { FirebaseClient } from '@api/firebase/firebase.client';

export class NotifyService {
  constructor(private readonly firebase: FirebaseClient) {}

  async sendAlert(topic: string, alert: Alert) {
    await this.firebase.sendMessage(topic, { type: 'alert', data: JSON.stringify(alert) });
  }
}
