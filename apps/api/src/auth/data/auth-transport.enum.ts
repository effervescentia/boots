import { t } from 'elysia';

export enum AuthTransport {
  BLE = 'ble',
  HYBRID = 'hybrid',
  INTERNAL = 'internal',
  NFC = 'nfc',
  USB = 'usb',
  SMART_CARD = 'smart-card',
}

export const AuthTransportDTO = t.UnionEnum(Object.values(AuthTransport) as [`${AuthTransport}`]);
