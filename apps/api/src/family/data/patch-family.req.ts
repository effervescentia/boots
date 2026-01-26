import { type Static, t } from 'elysia';
import { FamilyDTO } from './family.dto';

export type PatchFamily = Static<typeof PatchFamilyRequest>;

export const PatchFamilyRequest = t.Partial(t.Pick(FamilyDTO, ['name']));
