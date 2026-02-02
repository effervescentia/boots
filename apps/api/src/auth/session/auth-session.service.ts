import type { Environment } from '@api/app/app.env';
import type { DB } from '@api/db/db.types';
import { DataService } from '@api/global/data.service';
import jwt from '@elysiajs/jwt';
import { eq } from 'drizzle-orm';
import { type Cookie, t } from 'elysia';
import { ACCESS_TOKEN_TTL } from '../auth.const';
import { AUTH_COOKIE } from '../auth.plugin';
import { AuthSessionDB } from '../data/auth-session.db';

const AccessToken = t.Object({ sessionID: t.Number() });

export class AuthSessionService extends DataService {
  private static createAccessToken(secret: string) {
    return jwt({ secret, schema: AccessToken, exp: '10m' }).decorator.jwt;
  }

  readonly accessToken: ReturnType<typeof AuthSessionService.createAccessToken>;

  constructor(
    db: DB,
    private readonly env: Environment,
  ) {
    super(db);

    this.accessToken = AuthSessionService.createAccessToken(this.env.JWT_AUTH_SECRET);
  }

  async get(sessionID: number) {
    return this.db.query.AuthSessionDB.findFirst({
      where: eq(AuthSessionDB.id, sessionID),
      with: { credential: true },
    });
  }

  async delete(sessionID: number) {
    await this.db.delete(AuthSessionDB).where(eq(AuthSessionDB.id, sessionID));
  }

  async refreshAccessToken(accessToken: Cookie<string | undefined>, sessionID: number) {
    accessToken.set({
      ...AUTH_COOKIE,
      value: await this.accessToken.sign({ sessionID }),
      maxAge: ACCESS_TOKEN_TTL * 1000,
    });
  }
}
