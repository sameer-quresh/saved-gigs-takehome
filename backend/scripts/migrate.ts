import "dotenv/config";
import { getDb, destroyDb } from "../src/db";
import { sql } from "kysely";
import * as fs from "fs";
import * as path from "path";

async function migrate(): Promise<void> {
  const db = getDb({ mode: "write" });
  console.log("Running migrations...");

  const migrationPath = path.join(__dirname, "../migrations/0001_init.sql");
  const sqlContent = fs.readFileSync(migrationPath, "utf-8");

  await sql.raw(sqlContent).execute(db);

  console.log("Migrations applied successfully!");
  await destroyDb();
}

migrate().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

