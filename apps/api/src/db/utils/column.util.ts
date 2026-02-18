import { sql } from 'drizzle-orm';
import { customType } from 'drizzle-orm/pg-core';

export const bytea = customType<{ data: Buffer }>({
  dataType() {
    return 'bytea';
  },
  toDriver(value) {
    return sql`decode(${value.toString('hex')}, 'hex')`;
  },
});
