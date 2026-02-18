import { AccountService } from '@api/account/account.service';
import { DataService } from '@api/global/data.service';
import { insertOne } from '@bltx/db';
import { server as webauthn } from '@passwordless-id/webauthn';
import { eq, type InferInsertModel } from 'drizzle-orm';
import { NotFoundError } from 'elysia';
import { LOGIN_TTL, SIGNUP_TTL } from '../auth.const';
import type { AuthAlgorithm } from '../data/auth-algorithm.enum';
import { AuthCredentialDB } from '../data/auth-credential.db';
import { AuthSessionDB } from '../data/auth-session.db';
import type { AuthTransport } from '../data/auth-transport.enum';
import { AuthWebCredentialDB } from './data/auth-web-credential.db';
import type { VerifyWebLogin } from './data/verify-web-login.req';
import type { VerifyWebSignup } from './data/verify-web-signup.req';

export class AuthWebService extends DataService {
  static readonly SIGNUP_CHALLENGE = 'auth:web:signup:challenge';
  static readonly LOGIN_CHALLENGE = 'auth:web:login:challenge';

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

  async verifySignup(requestID: string, { registration }: VerifyWebSignup) {
    const challenge = await this.redis.getHashField(AuthWebService.SIGNUP_CHALLENGE, requestID, { delete: true });
    if (!challenge) throw new NotFoundError();

    const verification = await webauthn.verifyRegistration(registration, {
      origin: this.env.WEB_ORIGIN,
      challenge,
    });

    if (!verification.userVerified) throw new NotFoundError();

    const { credential } = verification;
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

  async negotiateLogin() {
    const requestID = Bun.randomUUIDv7();
    const challenge = webauthn.randomChallenge();

    await this.redis.setHashField(AuthWebService.LOGIN_CHALLENGE, requestID, challenge, { ttl: LOGIN_TTL });

    return { requestID, challenge };
  }

  async verifyLogin(requestID: string, { authentication }: VerifyWebLogin) {
    const challenge = await this.redis.getHashField(AuthWebService.LOGIN_CHALLENGE, requestID, { delete: true });
    if (!challenge) throw new NotFoundError();

    const credential = await this.db.query.AuthCredentialDB.findFirst({
      where: eq(AuthCredentialDB.id, authentication.id),
      with: { web: true },
    });
    if (!credential?.web) throw new NotFoundError();

    const account = await this.account.getDetails(credential.accountID);
    if (!account) throw new NotFoundError();

    const verification = await webauthn.verifyAuthentication(
      authentication,
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

    if (!verification.userVerified) throw new NotFoundError();

    await this.db.delete(AuthSessionDB).where(eq(AuthSessionDB.credentialID, credential.id));
    const session = await insertOne(this.db, AuthSessionDB, { credentialID: credential.id });

    return { account, session };
  }
}
