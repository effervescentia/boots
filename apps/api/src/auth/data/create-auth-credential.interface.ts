import type { AuthAlgorithm } from './auth-algorithm.enum';
import type { AuthTransport } from './auth-transport.enum';

export interface CreateAuthCredential {
  id: string;
  publicKey: string;
  algorithm: AuthAlgorithm;
  transports: AuthTransport[];
}
