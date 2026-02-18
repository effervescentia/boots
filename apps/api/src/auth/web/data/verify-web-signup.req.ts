import { AuthTransportDTO } from '@api/auth/data/auth-transport.enum';
import { WebAuthnAttachmentDTO, WebAuthnCredentialTypeDTO } from '@api/auth/data/webauthn.dto';
import { type Static, t } from 'elysia';

export type VerifyWebSignup = Static<typeof VerifyWebSignupRequest>;

export const VerifyWebSignupRequest = t.Object({
  registration: t.Object({
    type: WebAuthnCredentialTypeDTO,
    id: t.String(),
    rawId: t.String(),
    authenticatorAttachment: t.Optional(WebAuthnAttachmentDTO),

    clientExtensionResults: t.Object({
      appid: t.Optional(t.Boolean()),
      hmacCreateSecret: t.Optional(t.Boolean()),

      credProps: t.Optional(
        t.Object({
          rk: t.Optional(t.Boolean()),
        }),
      ),

      largeBlob: t.Optional(
        t.Object({
          blob: t.Optional(t.Any()),
          supported: t.Optional(t.Boolean()),
          written: t.Optional(t.Boolean()),
        }),
      ),

      prf: t.Optional(
        t.Object({
          blob: t.Optional(t.Any()),

          results: t.Optional(
            t.Object({
              first: t.Any(),
              second: t.Optional(t.Any()),
            }),
          ),
        }),
      ),
    }),

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
