import type { Environment } from '@api/app/app.env';
import type { AnyRecord } from '@bltx/core';
import admin from 'firebase-admin';
import { type App as FirebaseAdmin, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

export class FirebaseClient {
  private readonly firebaseAdmin: FirebaseAdmin;

  constructor(env: Environment) {
    this.firebaseAdmin = initializeApp({
      credential: admin.credential.cert(JSON.parse(env.GOOGLE_APPLICATION_CREDENTIALS)),
      databaseURL: env.FIREBASE_NOTIFICATION_DATABASE_URL,
    });
  }

  async sendMessage(topic: string, data: AnyRecord) {
    await getMessaging(this.firebaseAdmin).send({ topic, data });
  }
}
