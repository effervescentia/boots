import { FirebaseClient } from './firebase.client';

// biome-ignore lint/complexity/noStaticOnlyClass: global
export class FirebaseGlobal {
  static client: FirebaseClient;

  static init(...args: ConstructorParameters<typeof FirebaseClient>) {
    if (FirebaseGlobal.client) return;

    FirebaseGlobal.client = new FirebaseClient(...args);
  }
}
