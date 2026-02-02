import { AuthPlugin } from '@api/auth/auth.plugin';
import { DatabaseGlobal } from '@api/db/db.global';
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
  .use(AuthPlugin)
  .derive({ as: 'scoped' }, () => ({ service: new HeartbeatService(DatabaseGlobal.client) }))

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
    async ({ params, principal }) => {
      const heartbeat = await DatabaseGlobal.client.query.HeartbeatDB.findFirst({
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
    async ({ params, principal }) => {
      try {
        return await updateOne(
          DatabaseGlobal.client,
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
    async ({ params, principal }) => {
      await DatabaseGlobal.client
        .delete(HeartbeatDB)
        .where(and(eq(HeartbeatDB.id, params.heartbeatID), eq(HeartbeatDB.accountID, principal.id)));
    },
    {
      authenticated: true,
      params: HeartbeatParams,
    },
  );
