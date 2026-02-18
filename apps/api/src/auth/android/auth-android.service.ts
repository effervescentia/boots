import { AccountService } from '@api/account/account.service';
import { DataService } from '@api/global/data.service';
import { insertOne } from '@bltx/db';
import * as webauthn from '@simplewebauthn/server';
import base64url from 'base64url';
import { eq, type InferInsertModel } from 'drizzle-orm';
import { NotFoundError } from 'elysia';
import { LOGIN_TTL, SIGNUP_TTL } from '../auth.const';
import { AuthCredentialDB } from '../data/auth-credential.db';
import { AuthSessionDB } from '../data/auth-session.db';
import type { AuthTransport } from '../data/auth-transport.enum';
import { AndroidChallengeDetailsDTO } from './data/android-challenge-details.dto';
import { AuthAndroidCredentialDB } from './data/auth-android-credential.db';
import type { AuthDeviceType } from './data/auth-device-type.enum';
import type { VerifyAndroidLogin } from './data/verify-android-login.req';
import type { VerifyAndroidSignup } from './data/verify-android-signup.req';

const RP_ID = 'effervescentia.com';
const RP_NAME = 'Boots 4 Good';

export class AuthAndroidService extends DataService {
  static readonly SIGNUP_CHALLENGE = 'auth:android:signup:challenge';
  static readonly LOGIN_CHALLENGE = 'auth:android:login:challenge';

  private static fingerprintToOrigin(fingerprint: string) {
    return `android:apk-key-hash:${base64url.encode(fingerprint)}`;
  }

  private readonly account = new AccountService(this.db);

  private async createCredential(accountID: string, data: InferInsertModel<typeof AuthAndroidCredentialDB>) {
    const credential = await insertOne(this.db, AuthCredentialDB, { accountID, id: data.credentialID });
    await insertOne(this.db, AuthAndroidCredentialDB, data);
    return credential;
  }

  async negotiateSignup() {
    const requestID = Bun.randomUUIDv7();
    const registration = await webauthn.generateRegistrationOptions({
      rpID: RP_ID,
      rpName: RP_NAME,
      userName: 'boots',
      userDisplayName: 'boots',
      attestationType: 'none',
      authenticatorSelection: {
        requireResidentKey: true,
        residentKey: 'required',
        userVerification: 'required',
      },
    });

    await this.redis.setTypedHashField(
      AndroidChallengeDetailsDTO,
      AuthAndroidService.SIGNUP_CHALLENGE,
      requestID,
      {
        challenge: registration.challenge,
        webAuthnUserID: registration.user.id,
      },
      {
        ttl: SIGNUP_TTL,
      },
    );

    return { requestID, registration };
  }

  async verifySignup(requestID: string, data: VerifyAndroidSignup) {
    const challenge = await this.redis.getTypedHashField(
      AndroidChallengeDetailsDTO,
      AuthAndroidService.SIGNUP_CHALLENGE,
      requestID,
      { delete: true },
    );
    if (!challenge) throw new NotFoundError();

    const verification = await webauthn.verifyRegistrationResponse({
      response: data,
      expectedChallenge: challenge.challenge,
      expectedOrigin: AuthAndroidService.fingerprintToOrigin(this.env.ANDROID_FINGERPRINT),
      expectedRPID: RP_ID,
    });

    if (!verification.verified) throw new NotFoundError();

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
    const { account } = await this.account.create((tx, accountID) =>
      new AuthAndroidService(tx).createCredential(accountID, {
        credentialID: credential.id,
        webAuthnUserID: challenge.webAuthnUserID,
        publicKey: Buffer.from(credential.publicKey),
        counter: credential.counter,
        transports: (credential.transports ?? []) as AuthTransport[],
        deviceType: credentialDeviceType as AuthDeviceType,
        isBackedUp: credentialBackedUp,
      }),
    );

    const session = await insertOne(this.db, AuthSessionDB, { credentialID: credential.id });

    return { account, session };
  }

  async negotiateLogin() {
    const requestID = Bun.randomUUIDv7();
    const authentication = await webauthn.generateAuthenticationOptions({ rpID: RP_ID });

    await this.redis.setHashField(AuthAndroidService.LOGIN_CHALLENGE, requestID, authentication.challenge, {
      ttl: LOGIN_TTL,
    });

    return { requestID, authentication };
  }

  async verifyLogin(requestID: string, data: VerifyAndroidLogin) {
    const challenge = await this.redis.getHashField(AuthAndroidService.LOGIN_CHALLENGE, requestID, { delete: true });
    if (!challenge) throw new NotFoundError();

    const credential = await this.db.query.AuthCredentialDB.findFirst({
      where: eq(AuthCredentialDB.id, data.id),
      with: { android: true },
    });
    if (!credential?.android) throw new NotFoundError();

    const account = await this.account.getDetails(credential.accountID);
    if (!account) throw new NotFoundError();

    const verification = await webauthn.verifyAuthenticationResponse({
      response: data,
      expectedChallenge: challenge,
      expectedOrigin: AuthAndroidService.fingerprintToOrigin(this.env.ANDROID_FINGERPRINT),
      expectedRPID: RP_ID,
      credential: {
        id: credential.id,
        publicKey: credential.android.publicKey,
        counter: credential.android.counter,
        transports: credential.android.transports,
      },
    });

    if (!verification.verified) throw new NotFoundError();

    await this.db.delete(AuthSessionDB).where(eq(AuthSessionDB.credentialID, credential.id));
    const session = await insertOne(this.db, AuthSessionDB, { credentialID: credential.id });

    return { account, session };
  }
}
