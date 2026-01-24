import { type Static, t } from 'elysia';
import { AccountDTO } from './account.dto';

export type CreateAccount = Static<typeof CreateAccountRequest>;

export const CreateAccountRequest = t.Pick(AccountDTO, []);
