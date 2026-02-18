import {
  WebAuthnAssertionResponseDTO,
  WebAuthnAttachmentDTO,
  WebAuthnCredentialTypeDTO,
} from '@api/auth/data/webauthn.dto';
import { type Static, t } from 'elysia';

export type VerifyWebLogin = Static<typeof VerifyWebLoginRequest>;

export const VerifyWebLoginRequest = t.Object({
  authentication: t.Object({
    type: WebAuthnCredentialTypeDTO,
    id: t.String(),
    rawId: t.String(),
    authenticatorAttachment: t.Optional(WebAuthnAttachmentDTO),
    clientExtensionResults: t.Any(),

    response: WebAuthnAssertionResponseDTO,
  }),
});
