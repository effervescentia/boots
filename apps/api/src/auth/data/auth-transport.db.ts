import { nativeEnum } from '@bltx/db';
import { AuthTransport } from './auth-transport.enum';

export const AuthTransportEnum = nativeEnum('auth_transport', AuthTransport);
