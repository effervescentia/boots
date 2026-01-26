import { type Static, t } from 'elysia';
import { NetworkDTO } from './network.dto';

export type PatchNetwork = Static<typeof PatchNetworkRequest>;

export const PatchNetworkRequest = t.Partial(t.Pick(NetworkDTO, ['name']));
