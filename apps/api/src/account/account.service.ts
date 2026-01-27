import { AuthCredentialDB } from '@api/auth/data/auth-credential.db';
import type { AuthCredential } from '@api/auth/data/auth-credential.dto';
import type { CreateAuthCredential } from '@api/auth/data/create-auth-credential.interface';
import { FamilyMemberDB, NetworkMemberDB } from '@api/db/db.schema';
import { DataService } from '@api/global/data.service';
import { insertOne, updateOne } from '@bltx/db';
import { eq } from 'drizzle-orm';
import { InternalServerError } from 'elysia';
import { humanId } from 'human-id';
import { AccountDB } from './data/account.db';
import type { AccountDetails } from './data/account-details.dto';

export class AccountService extends DataService {
  private static generateUsername() {
    return humanId({ addAdverb: true, capitalize: false, separator: '_' });
  }

  private static getMillisecondSuffix() {
    return String(new Date().getMilliseconds()).padStart(3, '0');
  }

  private static getNanosecondSuffix() {
    return (String(performance.now()).split('.')[1] ?? '').padStart(6, '0');
  }

  private async getByUsername(username: string) {
    return this.db.query.AccountDB.findFirst({ where: eq(AccountDB.username, username) });
  }

  private async createWithUsername(
    username: string,
    data: CreateAuthCredential,
  ): Promise<{ account: AccountDetails; credential: AuthCredential }> {
    const { accountID, credential } = await this.transaction(async (tx) => {
      const account = await insertOne(tx, AccountDB, { username });
      const credential = await insertOne(tx, AuthCredentialDB, { accountID: account.id, ...data });

      return {
        accountID: account.id,
        credential,
      };
    });

    const account = await this.unsafeGetDetails(accountID);

    return { account, credential };
  }

  private async unsafeGetDetails(accountID: string) {
    const account = await this.getDetails(accountID);
    if (!account) throw new InternalServerError(`No Account exists with ID '${accountID}'`);

    return account;
  }

  async getDetails(accountID: string) {
    const account = await this.db.query.AccountDB.findFirst({
      where: eq(AccountDB.id, accountID),
      with: {
        families: { with: { family: true }, columns: { accountID: false, familyID: false } },
        networks: { with: { network: true }, columns: { accountID: false, networkID: false } },
      },
    });
    if (!account) return null;

    return {
      ...account,
      families: account.families.map(({ family, role }) => ({ ...family, role })),
      networks: account.networks.map(({ network, role }) => ({ ...network, role })),
    };
  }

  /**
   * this function recursively calls itself to find a new unique account alias
   */
  async create(credential: CreateAuthCredential): Promise<{ account: AccountDetails; credential: AuthCredential }> {
    const baseName = AccountService.generateUsername();
    const nameWithMilliseconds = `${baseName}_${AccountService.getMillisecondSuffix()}`;
    const nameWithNanoseconds = `${baseName}_${AccountService.getNanosecondSuffix()}`;

    for (const username of [baseName, nameWithMilliseconds, nameWithNanoseconds]) {
      if (!(await this.getByUsername(username))) return this.createWithUsername(username, credential);
    }

    return this.create(credential);
  }

  async delete(accountID: string) {
    await updateOne(this.db, AccountDB, eq(AccountDB.id, accountID), { deletedAt: new Date() });
    await this.db.delete(FamilyMemberDB).where(eq(FamilyMemberDB.accountID, accountID));
    await this.db.delete(NetworkMemberDB).where(eq(NetworkMemberDB.accountID, accountID));
    await this.db.delete(AuthCredentialDB).where(eq(AuthCredentialDB.accountID, accountID));
  }
}
