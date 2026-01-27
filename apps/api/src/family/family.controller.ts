import { AuthPlugin } from '@api/auth/auth.plugin';
import { DatabasePlugin } from '@api/db/db.plugin';
import { ForbiddenError } from '@api/global/forbidden.error';
import { RedisPlugin } from '@api/redis/redis.plugin';
import { eq } from 'drizzle-orm';
import Elysia, { NotFoundError, t } from 'elysia';
import { CreateFamilyRequest } from './data/create-family.req';
import { CreateFamilyInviteRequest } from './data/create-family-invite.req';
import { FamilyDB } from './data/family.db';
import { FamilyDTO } from './data/family.dto';
import { FamilyInviteResponse } from './data/family-invite.res';
import { FamilyRole } from './data/family-role.enum';
import { PatchFamilyRequest } from './data/patch-family.req';
import { FamilyService } from './family.service';

const FamilyParams = t.Object({ familyID: t.String({ format: 'uuid' }) });
const FamilyMemberParams = t.Composite([FamilyParams, t.Object({ accountID: t.String({ format: 'uuid' }) })]);

class FamilyNotFoundError extends NotFoundError {
  constructor(familyID: string) {
    super(`No Family exists with ID '${familyID}'`);
  }
}

export const FamilyController = new Elysia({ prefix: '/family' })
  .use(DatabasePlugin)
  .use(RedisPlugin)
  .use(AuthPlugin)
  .derive({ as: 'scoped' }, ({ db, redis }) => {
    const service = new FamilyService(db(), redis());

    return {
      service,

      assertMembership: async (familyID: string, accountID: string) => {
        const membership = await service.getMembership(familyID, accountID);
        if (!membership) throw new FamilyNotFoundError(familyID);
        return membership;
      },
    };
  })

  .post(
    '/',
    async ({ service, body, principal }) => {
      return service.create(principal.id, body);
    },
    {
      authenticated: true,
      body: CreateFamilyRequest,
      response: FamilyDTO,
    },
  )

  .get(
    '/:familyID',
    async ({ assertMembership, params, principal }) => {
      const membership = await assertMembership(params.familyID, principal.id);

      return membership.family;
    },
    {
      authenticated: true,
      params: FamilyParams,
      response: FamilyDTO,
    },
  )

  .patch(
    '/:familyID',
    async ({ service, assertMembership, params, body, principal }) => {
      const membership = await assertMembership(params.familyID, principal.id);
      if (membership.role !== FamilyRole.ADULT) throw new ForbiddenError('Only adults can update Family details');

      return service.patch(params.familyID, body);
    },
    {
      authenticated: true,
      params: FamilyParams,
      body: PatchFamilyRequest,
      response: FamilyDTO,
    },
  )

  .delete(
    '/:familyID',
    async ({ service, assertMembership, params, principal }) => {
      const membership = await assertMembership(params.familyID, principal.id);
      if (membership.role !== FamilyRole.ADULT) throw new ForbiddenError('Only adults can delete a Family');

      await service.delete(params.familyID);
    },
    {
      authenticated: true,
      params: FamilyParams,
    },
  )

  .delete(
    '/:familyID/membership',
    async ({ service, params, principal }) => {
      await service.deleteMember(params.familyID, principal.id);
    },
    {
      authenticated: true,
      params: FamilyParams,
    },
  )

  .delete(
    '/:familyID/member/:accountID',
    async ({ service, assertMembership, params, principal }) => {
      const membership = await assertMembership(params.familyID, principal.id);
      if (membership.role !== FamilyRole.ADULT) throw new ForbiddenError('Only adults can remove other Family members');

      await service.deleteMember(params.familyID, params.accountID);
    },
    {
      authenticated: true,
      params: FamilyMemberParams,
    },
  )

  .post(
    '/:familyID/invite',
    async ({ service, assertMembership, params, body, principal }) => {
      const membership = await assertMembership(params.familyID, principal.id);
      if (membership.role !== FamilyRole.ADULT) throw new ForbiddenError('Only adults can invite other Family members');

      return service.createInvite(params.familyID, body);
    },
    {
      authenticated: true,
      params: FamilyParams,
      body: CreateFamilyInviteRequest,
      response: FamilyInviteResponse,
    },
  )

  .put(
    '/invite/:inviteID',
    async ({ db, service, params, principal }) => {
      try {
        const familyID = await service.acceptInvite(principal.id, params.inviteID);

        return (await db().query.FamilyDB.findFirst({ where: eq(FamilyDB.id, familyID) })) ?? null;
      } catch {
        throw new NotFoundError();
      }
    },
    {
      authenticated: true,
      params: t.Object({ inviteID: t.String({ format: 'uuid' }) }),
      response: t.Nullable(FamilyDTO),
    },
  );
