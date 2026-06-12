import { describe, it, expect, beforeEach } from "vitest";
import { createApp } from "../../src/app";
import { getDb } from "../../src/db";
import { createTestAgent } from "../helpers/request";

const app = createApp();
const agent = createTestAgent(app);

describe("POST /api/gigs/:gigId/save", () => {
  beforeEach(async () => {
    const db = getDb({ mode: "write" });
    // Clean saved_gigs between tests to avoid state contamination
    await db.deleteFrom("saved_gigs").execute();
  });

  it("should successfully save an open gig", async () => {
    // Gig 1 is posted by Alice (1), so Bob (2) can save it
    const res = await agent.post("/api/gigs/1/save", {
      token: "user-2-token",
      body: { list: "WATCHLIST", note: "Need to do this soon" },
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.gig_id).toBe(1);
    expect(res.body.list).toBe("WATCHLIST");
    expect(res.body.note).toBe("Need to do this soon");
  });

  it("should return 400 when attempting to save own gig", async () => {
    // Gig 1 is posted by Alice (1), so Alice (1) cannot save it
    const res = await agent.post("/api/gigs/1/save", {
      token: "user-1-token",
      body: { list: "WATCHLIST" },
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("You cannot save your own gig");
  });

  it("should return 400 when attempting to save a closed gig", async () => {
    // Gig 6 is closed
    const res = await agent.post("/api/gigs/6/save", {
      token: "user-2-token",
      body: { list: "WATCHLIST" },
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("You cannot save a closed gig");
  });

  it("should return 404 when saving a non-existent gig", async () => {
    const res = await agent.post("/api/gigs/9999/save", {
      token: "user-1-token",
      body: { list: "WATCHLIST" },
    });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain("Gig not found");
  });

  it("should return 200 and update the row on duplicate save (idempotency)", async () => {
    // First save
    const res1 = await agent.post("/api/gigs/1/save", {
      token: "user-2-token",
      body: { list: "WATCHLIST", note: "First save note" },
    });
    expect(res1.status).toBe(201);

    // Second save (update)
    const res2 = await agent.post("/api/gigs/1/save", {
      token: "user-2-token",
      body: { list: "SHORTLIST", note: "Updated save note" },
    });

    expect(res2.status).toBe(200);
    expect(res2.body.id).toBe(res1.body.id);
    expect(res2.body.list).toBe("SHORTLIST");
    expect(res2.body.note).toBe("Updated save note");
  });

  it("should return 401 when no token is provided", async () => {
    const res = await agent.post("/api/gigs/1/save", {
      body: { list: "WATCHLIST" },
    });

    expect(res.status).toBe(401);
  });

  it("should return 403 when user does not have permission", async () => {
    const res = await agent.post("/api/gigs/1/save", {
      token: "user-1-readonly-token", // lacks Create:SavedGig permission
      body: { list: "WATCHLIST" },
    });

    expect(res.status).toBe(403);
  });
});
