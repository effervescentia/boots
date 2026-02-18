import { WebAuthnAttachmentDTO, WebAuthnCredentialTypeDTO } from '@api/auth/data/webauthn.dto';
import { type Static, t } from 'elysia';

export type VerifyAndroidSignup = Static<typeof VerifyAndroidSignupRequest>;

export const VerifyAndroidSignupRequest = t.Object({
  id: t.String(),
  rawId: t.String(),
  type: WebAuthnCredentialTypeDTO,
  clientExtensionResults: t.Any(),
  authenticatorAttachment: t.Optional(WebAuthnAttachmentDTO),

  response: t.Object({
    clientDataJSON: t.String(),
    attestationObject: t.String(),
  }),
});
