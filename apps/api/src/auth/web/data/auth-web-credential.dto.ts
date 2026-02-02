import { type Static, t } from 'elysia';
import { AuthAlgorithm } from '../../data/auth-algorithm.enum';
import { AuthTransportDTO } from '../../data/auth-transport.enum';

export type AuthWebCredential = Static<typeof AuthWebCredentialDTO>;

export const AuthWebCredentialDTO = t.Object({
  id: t.String(),
  accountID: t.String({ format: 'uuid' }),
  publicKey: t.String(),
  algorithm: t.Enum(AuthAlgorithm),
  transports: t.Array(AuthTransportDTO),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});
