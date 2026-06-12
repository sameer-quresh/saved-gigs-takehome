import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { createApp } from "../../src/app";
import { getDb } from "../../src/db";
import { createTestAgent } from "../helpers/request";
import { TOKEN_MAPPINGS } from "../../src/auth/tokens";

const app = createApp();
const agent = createTestAgent(app);

describe("DELETE /api/gigs/:gigId/save", () => {
  beforeAll(() => {
    // Add a mock token with no permissions to test 403
    TOKEN_MAPPINGS.push({
      token: "user-no-permissions-token",
      user: { id: 3, permissions: [] },
    });
  });

  beforeEach(async () => {
    const db = getDb({ mode: "write" });
    await db.deleteFrom("saved_gigs").execute();
  });

  it("should successfully delete an existing saved gig", async () => {
    // Bob (2) saves Gig 1
    await agent.post("/api/gigs/1/save", {
      token: "user-2-token",
      body: { list: "WATCHLIST" },
    });

    // Bob (2) deletes save on Gig 1
    const res = await agent.delete("/api/gigs/1/save", {
      token: "user-2-token",
    });

    expect(res.status).toBe(204);

    // Verify it was actually deleted in database
    const db = getDb({ mode: "read" });
    const row = await db
      .selectFrom("saved_gigs")
      .selectAll()
      .where("user_id", "=", 2)
      .where("gig_id", "=", 1)
      .executeTakeFirst();
    expect(row).toBeUndefined();
  });

  it("should return 204 when unsaving a gig that was never saved (idempotency)", async () => {
    const res = await agent.delete("/api/gigs/1/save", {
      token: "user-2-token",
    });

    expect(res.status).toBe(204);
  });

  it("should return 204 when unsaving a non-existent gig", async () => {
    const res = await agent.delete("/api/gigs/9999/save", {
      token: "user-2-token",
    });

    expect(res.status).toBe(204);
  });

  it("should return 401 when no token is provided", async () => {
    const res = await agent.delete("/api/gigs/1/save");

    expect(res.status).toBe(401);
  });

  it("should return 403 when user lacks delete permission", async () => {
    const res = await agent.delete("/api/gigs/1/save", {
      token: "user-no-permissions-token",
    });

    expect(res.status).toBe(403);
  });
});
