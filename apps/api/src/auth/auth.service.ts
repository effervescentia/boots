import { AccountService } from '@api/account/account.service';
import type { Environment } from '@api/app/app.env';
import type { DB } from '@api/db/db.types';
import { DataService } from '@api/global/data.service';
import { RedisService } from '@api/redis/redis.service';
import { insertOne } from '@bltx/db';
import { server as webauthn } from '@passwordless-id/webauthn';
import type { RedisClient } from 'bun';
import { eq } from 'drizzle-orm';
import { NotFoundError } from 'elysia';
import { LOGIN_TTL, SIGNUP_TTL } from './auth.const';
import type { AuthAlgorithm } from './data/auth-algorithm.enum';
import { AuthCredentialDB } from './data/auth-credential.db';
import { AuthSessionDB } from './data/auth-session.db';
import type { AuthTransport } from './data/auth-transport.enum';
import type { NegotiateLogin } from './data/negotiate-login.req';
import type { NegotiateSignup } from './data/negotiate-signup.req';
import type { VerifyLogin } from './data/verify-login.req';
import type { VerifySignup } from './data/verify-signup.req';

export class AuthService extends DataService {
  public static readonly SIGNUP_CHALLENGE = 'auth:signup:challenge';
  public static readonly LOGIN_CHALLENGE = 'auth:login:challenge';

  private readonly redis: RedisService;
  private readonly account = new AccountService(this.db);

  constructor(
    db: DB,
    redis: RedisClient,
    private readonly env: Environment,
  ) {
    super(db);

    this.redis = new RedisService(redis);
  }

  async negotiateSignup(_data: NegotiateSignup) {
    const requestID = Bun.randomUUIDv7();
    const challenge = webauthn.randomChallenge();

    await this.redis.setHashField(AuthService.SIGNUP_CHALLENGE, requestID, challenge, { ttl: SIGNUP_TTL });

    return { requestID, challenge };
  }

  async verifySignup(requestID: string, { registration }: VerifySignup) {
    const challenge = await this.redis.getDeleteHashField(AuthService.SIGNUP_CHALLENGE, requestID);
    if (!challenge) throw new NotFoundError();

    const result = await webauthn.verifyRegistration(registration, { origin: this.env.WEB_ORIGIN, challenge });

    if (!result.userVerified) throw new NotFoundError();

    const { account } = await this.account.create({
      id: result.credential.id,
      publicKey: result.credential.publicKey,
      algorithm: result.credential.algorithm as AuthAlgorithm,
      transports: result.credential.transports as AuthTransport[],
    });

    const session = await insertOne(this.db, AuthSessionDB, { credentialID: result.credential.id });

    return { account, session };
  }

  async negotiateLogin(_data: NegotiateLogin) {
    const requestID = Bun.randomUUIDv7();
    const challenge = webauthn.randomChallenge();

    await this.redis.setHashField(AuthService.LOGIN_CHALLENGE, requestID, challenge, { ttl: LOGIN_TTL });

    return { requestID, challenge };
  }

  async verifyLogin(requestID: string, data: VerifyLogin) {
    const challenge = await this.redis.getDeleteHashField(AuthService.LOGIN_CHALLENGE, requestID);
    if (!challenge) throw new NotFoundError();

    const credential = await this.db.query.AuthCredentialDB.findFirst({
      where: eq(AuthCredentialDB.id, data.authentication.id),
    });
    if (!credential) throw new NotFoundError();

    const account = await this.account.getDetails(credential.accountID);
    if (!account) throw new NotFoundError();

    const result = await webauthn.verifyAuthentication(
      data.authentication,
      {
        id: credential.id,
        publicKey: credential.publicKey,
        algorithm: credential.algorithm,
        transports: credential.transports,
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
