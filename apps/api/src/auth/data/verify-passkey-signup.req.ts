import { type Static, t } from 'elysia';
import { AuthTransportDTO } from './auth-transport.enum';

export type VerifyPasskeySignup = Static<typeof VerifyPasskeySignupRequest>;

export const VerifyPasskeySignupRequest = t.Object({
  registration: t.Object({
    type: t.Literal('public-key'),
    id: t.String(),
    rawId: t.String(),
    authenticatorAttachment: t.Optional(t.UnionEnum(['cross-platform', 'platform'])),
    clientExtensionResults: t.Any(),

    response: t.Object({
      attestationObject: t.String(),
      authenticatorData: t.String(),
      clientDataJSON: t.String(),
      publicKey: t.String(),
      publicKeyAlgorithm: t.Number(),
      transports: t.Array(AuthTransportDTO),
    }),

    user: t.Object({
      id: t.Optional(t.String()),
      name: t.String(),
      displayName: t.Optional(t.String()),
    }),
  }),
});
