import { type Static, t } from 'elysia';
import { FamilyDTO } from './family.dto';

export type CreateFamily = Static<typeof CreateFamilyRequest>;

export const CreateFamilyRequest = t.Pick(FamilyDTO, ['name']);
