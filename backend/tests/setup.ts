import "dotenv/config";
import { afterAll } from "vitest";
import { destroyDb } from "../src/db";

afterAll(async () => {
  // Destroy Kysely database instances to let Vitest exit cleanly
  await destroyDb();
});

