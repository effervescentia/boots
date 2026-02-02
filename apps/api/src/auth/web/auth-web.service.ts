import { AccountService } from '@api/account/account.service';
import { EnvironmentGlobal } from '@api/env/env.global';
import { DataService } from '@api/global/data.service';
import { RedisGlobal } from '@api/redis/redis.global';
import { insertOne } from '@bltx/db';
import { server as webauthn } from '@passwordless-id/webauthn';
import { eq, type InferInsertModel } from 'drizzle-orm';
import { NotFoundError } from 'elysia';
import { LOGIN_TTL, SIGNUP_TTL } from '../auth.const';
import type { AuthAlgorithm } from '../data/auth-algorithm.enum';
import { AuthCredentialDB } from '../data/auth-credential.db';
import { AuthSessionDB } from '../data/auth-session.db';
import type { AuthTransport } from '../data/auth-transport.enum';
import type { VerifyPasskeySignup } from '../data/verify-passkey-signup.req';
import { AuthWebCredentialDB } from './data/auth-web-credential.db';
import type { NegotiateWebLogin } from './data/negotiate-web-login.req';
import type { VerifyWebLogin } from './data/verify-web-login.req';

export class AuthWebService extends DataService {
  static readonly SIGNUP_CHALLENGE = 'auth:web:signup:challenge';
  static readonly LOGIN_CHALLENGE = 'auth:web:login:challenge';

  private readonly env = EnvironmentGlobal.data;
  private readonly redis = RedisGlobal.service;
  private readonly account = new AccountService(this.db);

  async createCredential(accountID: string, data: InferInsertModel<typeof AuthWebCredentialDB>) {
    const credential = await insertOne(this.db, AuthCredentialDB, { accountID, id: data.credentialID });
    await insertOne(this.db, AuthWebCredentialDB, data);
    return credential;
  }

  async negotiateSignup() {
    const requestID = Bun.randomUUIDv7();
    const challenge = webauthn.randomChallenge();

    await this.redis.setHashField(AuthWebService.SIGNUP_CHALLENGE, requestID, challenge, { ttl: SIGNUP_TTL });

    return { requestID, challenge };
  }

  async verifySignup(requestID: string, { registration }: VerifyPasskeySignup) {
    const challenge = await this.redis.getHashField(AuthWebService.SIGNUP_CHALLENGE, requestID, { delete: true });
    if (!challenge) throw new NotFoundError();

    const result = await webauthn.verifyRegistration(registration, {
      origin: this.env.WEB_ORIGIN,
      challenge,
    });

    if (!result.userVerified) throw new NotFoundError();

    const { credential } = result;
    const { account } = await this.account.create((tx, accountID) =>
      new AuthWebService(tx).createCredential(accountID, {
        credentialID: credential.id,
        publicKey: credential.publicKey,
        algorithm: credential.algorithm as AuthAlgorithm,
        transports: credential.transports as AuthTransport[],
      }),
    );

    const session = await insertOne(this.db, AuthSessionDB, { credentialID: credential.id });

    return { account, session };
  }

  async negotiateLogin(_data: NegotiateWebLogin) {
    const requestID = Bun.randomUUIDv7();
    const challenge = webauthn.randomChallenge();

    await this.redis.setHashField(AuthWebService.LOGIN_CHALLENGE, requestID, challenge, { ttl: LOGIN_TTL });

    return { requestID, challenge };
  }

  async verifyLogin(requestID: string, data: VerifyWebLogin) {
    const challenge = await this.redis.getHashField(AuthWebService.LOGIN_CHALLENGE, requestID, { delete: true });
    if (!challenge) throw new NotFoundError();

    const credential = await this.db.query.AuthCredentialDB.findFirst({
      where: eq(AuthCredentialDB.id, data.authentication.id),
      with: { web: true },
    });
    if (!credential?.web) throw new NotFoundError();

    const account = await this.account.getDetails(credential.accountID);
    if (!account) throw new NotFoundError();

    const result = await webauthn.verifyAuthentication(
      data.authentication,
      {
        id: credential.id,
        publicKey: credential.web.publicKey,
        algorithm: credential.web.algorithm,
        transports: credential.web.transports,
      },
      {
        origin: this.env.WEB_ORIGIN,
        challenge,
        userVerified: true,
      },
    );

    if (!result.userVerified) throw new NotFoundError();

    await this.db.delete(AuthSessionDB).where(eq(AuthSessionDB.credentialID, credential.id));
    const session = await insertOne(this.db, AuthSessionDB, { credentialID: credential.id });

    return { account, session };
  }
}
