import { UnsafeDTO } from '@api/global/data/unsafe.dto';
import { type Static, t } from 'elysia';
import { AlertDTO } from './alert.dto';
import type { AlertData } from './alert-data.interface';

export type AlertDetails = Static<typeof AlertDetailsDTO>;

export const AlertDetailsDTO = t.Composite([
  AlertDTO,
  t.Object({
    data: UnsafeDTO<AlertData>(),
  }),
]);
