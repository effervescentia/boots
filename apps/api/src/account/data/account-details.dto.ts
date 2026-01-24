import { type Static, t } from 'elysia';
import { AccountDTO } from './account.dto';

export type AccountDetails = Static<typeof AccountDetailsDTO>;

export const AccountDetailsDTO = t.Composite([AccountDTO, t.Object({})]);
