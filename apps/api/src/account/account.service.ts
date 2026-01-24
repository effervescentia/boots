import type { Environment } from '@api/app/app.env';
import type { DB } from '@api/db/db.types';
import { DataService } from '@api/global/data.service';
import { insertOne } from '@bltx/db';
import { eq } from 'drizzle-orm';
import { InternalServerError } from 'elysia';
import { humanId } from 'human-id';
import { AccountDB } from './data/account.db';
import type { Account } from './data/account.dto';

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

  constructor(
    db: DB,
    private readonly env: Environment,
  ) {
    super(db);
  }

  private async getByUsername(username: string) {
    return this.db.query.AccountDB.findFirst({ where: eq(AccountDB.username, username) });
  }

  private async createWithUsername(username: string) {
    const accountID = await this.transaction(async (tx) => {
      const account = await insertOne(tx, AccountDB, { username });

      return account.id;
    });

    return this.unsafeGetDetails(accountID);
  }

  private async unsafeGetDetails(accountID: string) {
    const account = await this.getDetails(accountID);
    if (!account) throw new InternalServerError(`No Account exists with ID '${accountID}'`);

    return account;
  }

  async getDetails(accountID: string) {
    return this.db.query.AccountDB.findFirst({
      where: eq(AccountDB.id, accountID),
      with: {},
    });
  }

  /**
   * this function recursively calls itself to find a new unique account alias
   */
  async create(): Promise<Account> {
    const baseName = AccountService.generateUsername();
    const nameWithMilliseconds = `${baseName}_${AccountService.getMillisecondSuffix()}`;
    const nameWithNanoseconds = `${baseName}_${AccountService.getNanosecondSuffix()}`;

    for (const username of [baseName, nameWithMilliseconds, nameWithNanoseconds]) {
      if (!(await this.getByUsername(username))) return this.createWithUsername(username);
    }

    return this.create();
  }

  async delete(accountID: string) {
    await this.db.delete(AccountDB).where(eq(AccountDB.id, accountID));
  }
}
