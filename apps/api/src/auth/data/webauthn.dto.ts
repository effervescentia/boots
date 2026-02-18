import { t } from 'elysia';
import { AuthTransportDTO } from './auth-transport.enum';

export const WebAuthnCredentialTypeDTO = t.Literal('public-key');

export const WebAuthnHintDTO = t.UnionEnum(['hybrid', 'security-key', 'client-device']);

export const WebAuthnRequirementDTO = t.UnionEnum(['discouraged', 'preferred', 'required']);

export const WebAuthnAttachmentDTO = t.UnionEnum(['cross-platform', 'platform']);

export const WebAuthnExtensionDTO = t.Object({
  appid: t.Optional(t.String()),
  credProps: t.Optional(t.Boolean()),
  hmacCreateSecret: t.Optional(t.Boolean()),
  minPinLength: t.Optional(t.Boolean()),
});

export const WebAuthnCredentialDTO = t.Object({
  id: t.String(),
  type: WebAuthnCredentialTypeDTO,
  transports: t.Optional(t.Array(AuthTransportDTO)),
});

export const WebAuthnAssertionResponseDTO = t.Object({
  clientDataJSON: t.String(),
  authenticatorData: t.String(),
  signature: t.String(),
  userHandle: t.Optional(t.String()),
});
