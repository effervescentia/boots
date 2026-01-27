import { type Static, t } from 'elysia';
import { AlertDTO } from './alert.dto';

export type CreateAlert = Static<typeof CreateAlertRequest>;

export const CreateAlertRequest = t.Pick(AlertDTO, [
  // TODO: implement me
]);
