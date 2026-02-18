import {
  WebAuthnAttachmentDTO,
  WebAuthnCredentialDTO,
  WebAuthnCredentialTypeDTO,
  WebAuthnExtensionDTO,
  WebAuthnHintDTO,
  WebAuthnRequirementDTO,
} from '@api/auth/data/webauthn.dto';
import { type Static, t } from 'elysia';

export type NegotiateAndroidSignup = Static<typeof NegotiateAndroidSignupResponse>;

export const NegotiateAndroidSignupResponse = t.Object({
  challenge: t.String(),
  attestation: t.Optional(t.UnionEnum(['direct', 'enterprise', 'indirect', 'none'])),
  attestationFormats: t.Optional(
    t.Array(t.UnionEnum(['fido-u2f', 'packed', 'android-safetynet', 'android-key', 'tpm', 'apple', 'none'])),
  ),
  excludeCredentials: t.Optional(t.Array(WebAuthnCredentialDTO)),
  hints: t.Optional(t.Array(WebAuthnHintDTO)),
  extensions: t.Optional(WebAuthnExtensionDTO),
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
      authenticatorAttachment: t.Optional(WebAuthnAttachmentDTO),
      requireResidentKey: t.Optional(t.Boolean()),
      residentKey: t.Optional(WebAuthnRequirementDTO),
      userVerification: t.Optional(WebAuthnRequirementDTO),
    }),
  ),

  pubKeyCredParams: t.Array(
    t.Object({
      alg: t.Number(),
      type: WebAuthnCredentialTypeDTO,
    }),
  ),
});
