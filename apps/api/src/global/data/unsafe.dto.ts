import { t } from 'elysia';

export type UnsafeCast<Value> = ReturnType<typeof t.Unsafe<Value>>;

export const UnsafeDTO = <Value>() => t.Any() as UnsafeCast<Value>;
