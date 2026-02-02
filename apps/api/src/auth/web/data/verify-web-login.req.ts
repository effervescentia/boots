import { type Static, t } from 'elysia';

export type VerifyWebLogin = Static<typeof VerifyWebLoginRequest>;

export const VerifyWebLoginRequest = t.Object({
  authentication: t.Object({
    type: t.Literal('public-key'),
    id: t.String(),
    rawId: t.String(),
    authenticatorAttachment: t.Optional(t.UnionEnum(['cross-platform', 'platform'])),
    clientExtensionResults: t.Any(),

    response: t.Object({
      clientDataJSON: t.String(),
      authenticatorData: t.String(),
      signature: t.String(),
      userHandle: t.Optional(t.String()),
    }),
  }),
});
