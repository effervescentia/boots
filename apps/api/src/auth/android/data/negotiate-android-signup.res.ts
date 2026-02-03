import { AuthTransportDTO } from '@api/auth/data/auth-transport.enum';
import { type Static, t } from 'elysia';

export type NegotiateAndroidSignup = Static<typeof NegotiateAndroidSignupResponse>;

export const NegotiateAndroidSignupResponse = t.Object({
  challenge: t.String(),
  attestation: t.Optional(t.UnionEnum(['direct', 'enterprise', 'indirect', 'none'])),
  attestationFormats: t.Optional(
    t.Array(t.UnionEnum(['fido-u2f', 'packed', 'android-safetynet', 'android-key', 'tpm', 'apple', 'none'])),
  ),
  hints: t.Optional(t.Array(t.UnionEnum(['hybrid', 'security-key', 'client-device']))),
  timeout: t.Optional(t.Number()),

  rp: t.Object({
    id: t.Optional(t.String()),
    name: t.String(),
  }),

  user: t.Object({
    id: t.String(),
    name: t.String(),
    displayName: t.String(),
  }),

  authenticatorSelection: t.Optional(
    t.Object({
      authenticatorAttachment: t.Optional(t.UnionEnum(['cross-platform', 'platform'])),
      requireResidentKey: t.Optional(t.Boolean()),
      residentKey: t.Optional(t.UnionEnum(['discouraged', 'preferred', 'required'])),
      userVerification: t.Optional(t.UnionEnum(['discouraged', 'preferred', 'required'])),
    }),
  ),

  excludeCredentials: t.Optional(
    t.Array(
      t.Object({
        id: t.String(),
        type: t.Literal('public-key'),
        transports: t.Optional(t.Array(AuthTransportDTO)),
      }),
    ),
  ),

  extensions: t.Optional(
    t.Object({
      appid: t.Optional(t.String()),
      credProps: t.Optional(t.Boolean()),
      hmacCreateSecret: t.Optional(t.Boolean()),
      minPinLength: t.Optional(t.Boolean()),
    }),
  ),

  pubKeyCredParams: t.Array(
    t.Object({
      alg: t.Number(),
      type: t.Literal('public-key'),
    }),
  ),
});
