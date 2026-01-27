import { type Static, t } from 'elysia';
import { AlertDTO } from './alert.dto';

export type PatchAlert = Static<typeof PatchAlertRequest>;

export const PatchAlertRequest = t.Partial(t.Pick(AlertDTO, [
  // TODO: implement me
]));
