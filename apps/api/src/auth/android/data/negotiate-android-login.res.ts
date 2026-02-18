import {
  WebAuthnCredentialDTO,
  WebAuthnExtensionDTO,
  WebAuthnHintDTO,
  WebAuthnRequirementDTO,
} from '@api/auth/data/webauthn.dto';
import { type Static, t } from 'elysia';

export type NegotiateAndroidLogin = Static<typeof NegotiateAndroidLoginResponse>;

export const NegotiateAndroidLoginResponse = t.Object({
  challenge: t.String(),
  rpId: t.Optional(t.String()),
  timeout: t.Optional(t.Number()),
  userVerification: t.Optional(WebAuthnRequirementDTO),
  hints: t.Optional(t.Array(WebAuthnHintDTO)),
  extensions: t.Optional(WebAuthnExtensionDTO),
  allowCredentials: t.Optional(t.Array(WebAuthnCredentialDTO)),
});
