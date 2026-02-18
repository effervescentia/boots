import {
  WebAuthnAssertionResponseDTO,
  WebAuthnAttachmentDTO,
  WebAuthnCredentialTypeDTO,
} from '@api/auth/data/webauthn.dto';
import { type Static, t } from 'elysia';

export type VerifyAndroidLogin = Static<typeof VerifyAndroidLoginRequest>;

export const VerifyAndroidLoginRequest = t.Object({
  type: WebAuthnCredentialTypeDTO,
  id: t.String(),
  rawId: t.String(),
  authenticatorAttachment: t.Optional(WebAuthnAttachmentDTO),
  clientExtensionResults: t.Any(),
  response: WebAuthnAssertionResponseDTO,
});
