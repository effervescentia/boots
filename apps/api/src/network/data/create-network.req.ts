import { type Static, t } from 'elysia';
import { NetworkDTO } from './network.dto';

export type CreateNetwork = Static<typeof CreateNetworkRequest>;

export const CreateNetworkRequest = t.Pick(NetworkDTO, ['name']);
