import Elysia from 'elysia';
import { AuthSessionController } from './session/auth-session.controller';

export const AuthModule = new Elysia({ prefix: '/auth' }).use(AuthSessionController);
