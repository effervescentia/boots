import { type Static, t } from 'elysia';

export type VerifyAndroidSignup = Static<typeof VerifyAndroidSignupRequest>;

export const VerifyAndroidSignupRequest = t.Object({
  id: t.String(),
  rawId: t.String(),
  type: t.Literal('public-key'),
  clientExtensionResults: t.Any(),
  authenticatorAttachment: t.Optional(t.UnionEnum(['cross-platform', 'platform'])),

  response: t.Object({
    clientDataJSON: t.String(),
    attestationObject: t.String(),
  }),
});
