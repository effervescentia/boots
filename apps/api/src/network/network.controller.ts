import { AuthPlugin } from '@api/auth/auth.plugin';
import { DatabasePlugin } from '@api/db/db.plugin';
import { ConflictError } from '@api/global/conflict.error';
import { ForbiddenError } from '@api/global/forbidden.error';
import { RedisPlugin } from '@api/redis/redis.plugin';
import { and, eq } from 'drizzle-orm';
import Elysia, { NotFoundError, t } from 'elysia';
import { CreateNetworkRequest } from './data/create-network.req';
import { CreateNetworkInviteRequest } from './data/create-network-invite.req';
import { NetworkDB } from './data/network.db';
import { NetworkDTO } from './data/network.dto';
import { NetworkInviteResponse } from './data/network-invite.res';
import { NetworkMemberDB } from './data/network-member.db';
import { NetworkRole } from './data/network-role.enum';
import { PatchNetworkRequest } from './data/patch-network.req';
import { NetworkService } from './network.service';

const NetworkParams = t.Object({ networkID: t.String({ format: 'uuid' }) });
const NetworkMemberParams = t.Composite([NetworkParams, t.Object({ accountID: t.String({ format: 'uuid' }) })]);

export const NetworkController = new Elysia({ prefix: '/network' })
  .use(DatabasePlugin)
  .use(RedisPlugin)
  .use(AuthPlugin)
  .derive({ as: 'scoped' }, ({ db, redis }) => ({ service: new NetworkService(db(), redis()) }))

  .post(
    '/',
    async ({ service, body, principal }) => {
      return service.create(principal.id, body);
    },
    {
      authenticated: true,
      body: CreateNetworkRequest,
      response: NetworkDTO,
    },
  )

  .get(
    '/:networkID',
    async ({ service, params, principal }) => {
      const membership = await service.assertMembership(params.networkID, principal.id);

      return membership.network;
    },
    {
      authenticated: true,
      params: NetworkParams,
      response: NetworkDTO,
    },
  )

  .patch(
    '/:networkID',
    async ({ db, service, params, body, principal }) => {
      const membership = await service.assertMembership(params.networkID, principal.id);
      const leaderCount = await db().$count(
        NetworkMemberDB,
        and(eq(NetworkMemberDB.networkID, params.networkID), eq(NetworkMemberDB.role, NetworkRole.LEADER)),
      );
      if (leaderCount && membership.role !== NetworkRole.LEADER) {
        throw new ForbiddenError('Only leaders can update Network details');
      }

      return service.patch(params.networkID, body);
    },
    {
      authenticated: true,
      params: NetworkParams,
      body: PatchNetworkRequest,
      response: NetworkDTO,
    },
  )

  .delete(
    '/:networkID',
    async ({ db, service, params, principal }) => {
      await service.assertMembership(params.networkID, principal.id);

      const memberCount = await db().$count(NetworkMemberDB, eq(NetworkMemberDB.networkID, params.networkID));
      if (memberCount > 1) throw new ConflictError('Networks with more than one member cannot be deleted');

      await service.delete(params.networkID);
    },
    {
      authenticated: true,
      params: NetworkParams,
    },
  )

  .delete(
    '/:networkID/membership',
    async ({ service, params, principal }) => {
      await service.deleteMember(params.networkID, principal.id);
    },
    {
      authenticated: true,
      params: NetworkParams,
    },
  )

  .delete(
    '/:networkID/member/:accountID',
    async ({ service, params, principal }) => {
      const membership = await service.assertMembership(params.networkID, principal.id);
      if (membership.role !== NetworkRole.LEADER) {
        throw new ForbiddenError('Only leaders can remove other Network members');
      }

      await service.deleteMember(params.networkID, params.accountID);
    },
    {
      authenticated: true,
      params: NetworkMemberParams,
    },
  )

  .post(
    '/:networkID/invite',
    async ({ service, params, body, principal }) => {
      const membership = await service.assertMembership(params.networkID, principal.id);
      if (body.role === NetworkRole.LEADER && membership.role !== NetworkRole.LEADER) {
        throw new ForbiddenError('Only leaders can invite other leaders');
      }

      return service.createInvite(params.networkID, principal.id, body);
    },
    {
      authenticated: true,
      params: NetworkParams,
      body: CreateNetworkInviteRequest,
      response: NetworkInviteResponse,
    },
  )

  .put(
    '/invite/:inviteID',
    async ({ db, service, params, principal }) => {
      try {
        const networkID = await service.acceptInvite(principal.id, params.inviteID);

        return (await db().query.NetworkDB.findFirst({ where: eq(NetworkDB.id, networkID) })) ?? null;
      } catch {
        throw new NotFoundError();
      }
    },
    {
      authenticated: true,
      params: t.Object({ inviteID: t.String({ format: 'uuid' }) }),
      response: t.Nullable(NetworkDTO),
    },
  );
