import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { getEnv } from "../config/env";
import type { Database } from "./types";

export type DbMode = "read" | "write";

const pools = new Map<DbMode, pg.Pool>();
const instances = new Map<DbMode, Kysely<Database>>();

function getPool(mode: DbMode): pg.Pool {
  const existing = pools.get(mode);
  if (existing) {
    return existing;
  }

  const { DATABASE_URL } = getEnv();
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  pools.set(mode, pool);
  return pool;
}

export function getDb(options: { mode: DbMode }): Kysely<Database> {
  const existing = instances.get(options.mode);
  if (existing) {
    return existing;
  }

  const db = new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: getPool(options.mode),
    }),
  });

  instances.set(options.mode, db);
  return db;
}

export async function destroyDb(): Promise<void> {
  await Promise.all([...instances.values()].map((db) => db.destroy()));
  instances.clear();
  pools.clear();
}
