import { AccountService } from '@api/account/account.service';
import type { Environment } from '@api/app/app.env';
import type { DB } from '@api/db/db.types';
import { DataService } from '@api/global/data.service';
import type { RedisService } from '@api/redis/redis.service';
import { insertOne } from '@bltx/db';
import { server as webauthn } from '@passwordless-id/webauthn';
import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';
import { eq, type InferInsertModel } from 'drizzle-orm';
import { NotFoundError } from 'elysia';
import { LOGIN_TTL, SIGNUP_TTL } from '../auth.const';
import { AuthCredentialDB } from '../data/auth-credential.db';
import { AuthSessionDB } from '../data/auth-session.db';
import type { AuthTransport } from '../data/auth-transport.enum';
import type { VerifyPasskeySignup } from '../data/verify-passkey-signup.req';
import type { NegotiateWebLogin } from '../web/data/negotiate-web-login.req';
import type { VerifyWebLogin } from '../web/data/verify-web-login.req';
import { AndroidChallengeDetailsDTO } from './data/android-challenge-details.dto';
import { AuthAndroidCredentialDB } from './data/auth-android-credential.db';
import type { AuthDeviceType } from './data/auth-device-type.enum';

const RP_ID = 'boots.localhost';
const RP_NAME = 'Boots 4 Good';

export class AuthAndroidService extends DataService {
  public static readonly SIGNUP_CHALLENGE = 'auth:android:signup:challenge';
  public static readonly LOGIN_CHALLENGE = 'auth:android:login:challenge';

  private readonly account = new AccountService(this.db);

  constructor(
    db: DB,
    private readonly redis: RedisService,
    private readonly env: Environment,
  ) {
    super(db);
  }

  private async createCredential(accountID: string, data: InferInsertModel<typeof AuthAndroidCredentialDB>) {
    const credential = await insertOne(this.db, AuthCredentialDB, { accountID, id: data.credentialID });
    await insertOne(this.db, AuthAndroidCredentialDB, data);
    return credential;
  }

  async negotiateSignup() {
    const requestID = Bun.randomUUIDv7();
    const registration = await generateRegistrationOptions({
      rpID: RP_ID,
      rpName: RP_NAME,
      userName: 'boots',
      attestationType: 'none',
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

    return { requestID, challenge: registration.challenge };
  }

  async verifySignup(requestID: string, { registration }: VerifyPasskeySignup) {
    const challenge = await this.redis.getTypedHashField(
      AndroidChallengeDetailsDTO,
      AuthAndroidService.SIGNUP_CHALLENGE,
      requestID,
      { delete: true },
    );
    if (!challenge) throw new NotFoundError();

    const verification = await verifyRegistrationResponse({
      response: registration,
      expectedChallenge: challenge.challenge,
      expectedOrigin: this.env.WEB_ORIGIN,
      expectedRPID: RP_ID,
    });

    if (!verification.verified) throw new NotFoundError();

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
    const { account } = await this.account.create((tx, accountID) =>
      new AuthAndroidService(tx, this.redis, this.env).createCredential(accountID, {
        credentialID: credential.id,
        webAuthnUserID: challenge.webAuthnUserID,
        publicKey: credential.publicKey,
        counter: credential.counter,
        transports: credential.transports as AuthTransport[],
        deviceType: credentialDeviceType as AuthDeviceType,
        isBackedUp: credentialBackedUp,
      }),
    );

    const session = await insertOne(this.db, AuthSessionDB, { credentialID: credential.id });

    return { account, session };
  }

  // async negotiateLogin(_data: NegotiateWebLogin) {
  //   const requestID = Bun.randomUUIDv7();
  //   const challenge = webauthn.randomChallenge();

  //   await this.redis.setHashField(AuthAndroidService.LOGIN_CHALLENGE, requestID, challenge, { ttl: LOGIN_TTL });

  //   return { requestID, challenge };
  // }

  // async verifyLogin(requestID: string, data: VerifyWebLogin) {
  //   const challenge = await this.redis.getHashField(AuthAndroidService.LOGIN_CHALLENGE, requestID, { delete: true });
  //   if (!challenge) throw new NotFoundError();

  //   const credential = await this.db.query.AuthCredentialDB.findFirst({
  //     where: eq(AuthCredentialDB.id, data.authentication.id),
  //     with: { android: true },
  //   });
  //   if (!credential?.android) throw new NotFoundError();

  //   const account = await this.account.getDetails(credential.accountID);
  //   if (!account) throw new NotFoundError();

  //   const result = await webauthn.verifyAuthentication(
  //     data.authentication,
  //     {
  //       id: credential.id,
  //       publicKey: credential.android.publicKey,
  //       algorithm: credential.android.algorithm,
  //       transports: credential.android.transports,
  //     },
  //     {
  //       origin: this.env.WEB_ORIGIN,
  //       challenge,
  //       userVerified: true,
  //     },
  //   );

  //   if (!result.userVerified) throw new NotFoundError();

  //   await this.db.delete(AuthSessionDB).where(eq(AuthSessionDB.credentialID, credential.id));
  //   const session = await insertOne(this.db, AuthSessionDB, { credentialID: credential.id });

  //   return { account, session };
  // }
}
