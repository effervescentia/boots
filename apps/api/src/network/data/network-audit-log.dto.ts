import { t } from 'elysia';

export const JoinNetworkLogDTO = t.Object({
  type: t.Literal('join_network'),
  accountID: t.String({ format: 'uuid' }),
  invitedBy: t.String({ format: 'uuid' }),
});

export const NetworkAuditLogDTO = t.Union([JoinNetworkLogDTO]);
