import fs from 'node:fs/promises';
import { DatabaseGlobal } from '@api/db/db.global';
// biome-ignore lint/style/noRestrictedImports: test import
import * as schema from '@api/db/db.schema';
import type { DB } from '@api/db/db.types';
import type { AnyRecord } from '@bltx/core';
import { PGlite } from '@electric-sql/pglite';
import { generateDrizzleJson, generateMigration } from 'drizzle-kit/api';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';

// biome-ignore lint/complexity/noStaticOnlyClass: global mock
export class DatabaseMock {
  static seedData: File | Blob | null = null;
  static pglite: PGlite;

  private static tempDir(tag: string) {
    return `/tmp/boots-db-${tag}-${Bun.randomUUIDv7()}.db`;
  }

  private static async dumpSeedData<Schema extends AnyRecord>(schema: Schema) {
    const dbDir = DatabaseMock.tempDir('seed');
    const client = new PGlite({ dataDir: dbDir });

    const db = drizzle({ client, schema });

    const statements = await generateMigration(generateDrizzleJson({}), generateDrizzleJson(schema));

    await db.transaction(async (tx) => {
      for (const sql of statements) {
        await tx.execute(sql);
      }
    });

    const data = await client.dumpDataDir();
    await client.close();

    await fs.rm(dbDir, { recursive: true, force: true });

    return data;
  }

  static async init() {
    DatabaseMock.seedData ??= await DatabaseMock.dumpSeedData(schema);
    DatabaseMock.pglite = new PGlite({ dataDir: DatabaseMock.tempDir('test'), loadDataDir: DatabaseMock.seedData });
    DatabaseGlobal.client = drizzle({ schema, client: DatabaseMock.pglite }) as unknown as DB;
  }

  static async teardown() {
    if (!DatabaseMock.pglite) return;

    await DatabaseMock.pglite.close();
    if (DatabaseMock.pglite.dataDir) {
      await fs.rm(DatabaseMock.pglite.dataDir, { recursive: true, force: true });
    }
  }

  static async truncate() {
    await DatabaseGlobal.client.transaction(async (tx) => {
      for (const table of Object.values(tx._.schema ?? {})) {
        await tx.execute(sql`TRUNCATE TABLE ${sql.identifier((table as { dbName: string }).dbName)} CASCADE`);
      }
    });
  }
}
