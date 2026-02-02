import type { FirebaseClient } from '@api/firebase/firebase.client';
import { FirebaseGlobal } from '@api/firebase/firebase.global';
import { createMock, type DeepMocked } from '@test/mock.util';

// biome-ignore lint/complexity/noStaticOnlyClass: global mock
export class FirebaseMock {
  static firebase: DeepMocked<FirebaseClient>;

  static init() {
    FirebaseMock.firebase = createMock<FirebaseClient>();
    FirebaseGlobal.client = FirebaseMock.firebase;
  }
}
