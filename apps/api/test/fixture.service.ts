import { AccountService } from '@api/account/account.service';
import type { Environment } from '@api/app/app.env';
import { AuthAlgorithm } from '@api/auth/data/auth-algorithm.enum';
import { AuthTransport } from '@api/auth/data/auth-transport.enum';
import { AuthWebService } from '@api/auth/web/auth-web.service';
import type { DB } from '@api/db/db.types';
import { RedisPlugin } from '@api/redis/redis.plugin';

export class FixtureService {
  private readonly redis = RedisPlugin.decorator.redis();

  constructor(
    private readonly db: DB,
    private readonly env: Environment,
  ) {}

  createAccount() {
    return new AccountService(this.db).create((tx, accountID) =>
      new AuthWebService(tx, this.redis, this.env).createCredential(accountID, {
        credentialID: Bun.randomUUIDv7(),
        publicKey: 'public-key',
        algorithm: AuthAlgorithm.EdDSA,
        transports: [AuthTransport.NFC],
      }),
    );
  }
}
