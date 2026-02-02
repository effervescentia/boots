import { AuthPlugin } from '@api/auth/auth.plugin';
import { DatabasePlugin } from '@api/db/db.plugin';
import { FirebasePlugin } from '@api/firebase/firebase.plugin';
import { updateOne } from '@bltx/db';
import { and, eq } from 'drizzle-orm';
import Elysia, { NotFoundError, t } from 'elysia';
import { CreateHeartbeatRequest } from './data/create-heartbeat.req';
import { HeartbeatDB } from './data/heartbeat.db';
import { HeartbeatDTO } from './data/heartbeat.dto';
import { HeartbeatService } from './heartbeat.service';

const HeartbeatParams = t.Object({ heartbeatID: t.String({ format: 'uuid' }) });

class HeartbeatNotFoundError extends NotFoundError {
  constructor(heartbeatID: string) {
    super(`No Heartbeat exists with ID '${heartbeatID}'`);
  }
}

export const HeartbeatController = new Elysia({ prefix: '/heartbeat' })
  .use(DatabasePlugin)
  .use(FirebasePlugin)
  .use(AuthPlugin)
  .derive({ as: 'scoped' }, ({ db, firebase }) => ({ service: new HeartbeatService(db(), firebase()) }))

  .post(
    '/',
    async ({ service, body, principal }) => {
      return service.create(principal.id, body);
    },
    {
      authenticated: true,
      body: CreateHeartbeatRequest,
      response: HeartbeatDTO,
    },
  )

  .get(
    '/:heartbeatID',
    async ({ db, params, principal }) => {
      const heartbeat = await db().query.HeartbeatDB.findFirst({
        where: and(eq(HeartbeatDB.id, params.heartbeatID), eq(HeartbeatDB.accountID, principal.id)),
      });
      if (!heartbeat) throw new HeartbeatNotFoundError(params.heartbeatID);

      return heartbeat;
    },
    {
      authenticated: true,
      params: HeartbeatParams,
      response: HeartbeatDTO,
    },
  )

  .put(
    '/:heartbeatID/ping',
    async ({ db, params, principal }) => {
      try {
        return await updateOne(
          db(),
          HeartbeatDB,
          and(eq(HeartbeatDB.id, params.heartbeatID), eq(HeartbeatDB.accountID, principal.id))!,
          { updatedAt: new Date() },
        );
      } catch {
        throw new HeartbeatNotFoundError(params.heartbeatID);
      }
    },
    {
      authenticated: true,
      params: HeartbeatParams,
    },
  )

  .delete(
    '/:heartbeatID',
    async ({ db, params, principal }) => {
      await db()
        .delete(HeartbeatDB)
        .where(and(eq(HeartbeatDB.id, params.heartbeatID), eq(HeartbeatDB.accountID, principal.id)));
    },
    {
      authenticated: true,
      params: HeartbeatParams,
    },
  );
