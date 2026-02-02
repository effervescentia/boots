import { AccountService } from '@api/account/account.service';
import { AuthAlgorithm } from '@api/auth/data/auth-algorithm.enum';
import { AuthTransport } from '@api/auth/data/auth-transport.enum';
import { AuthWebService } from '@api/auth/web/auth-web.service';
import type { DB } from '@api/db/db.types';

export class FixtureService {
  constructor(private readonly db: DB) {}

  createAccount() {
    return new AccountService(this.db).create((tx, accountID) =>
      new AuthWebService(tx).createCredential(accountID, {
        credentialID: Bun.randomUUIDv7(),
        publicKey: 'public-key',
        algorithm: AuthAlgorithm.EdDSA,
        transports: [AuthTransport.NFC],
      }),
    );
  }
}
