import { FirebaseClient } from './firebase.client';

// biome-ignore lint/complexity/noStaticOnlyClass: global
export class FirebaseGlobal {
  public static client: FirebaseClient;

  public static init(...args: ConstructorParameters<typeof FirebaseClient>) {
    FirebaseGlobal.client = new FirebaseClient(...args);
  }
}
