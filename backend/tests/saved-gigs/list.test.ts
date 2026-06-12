import { describe, it, expect, beforeEach } from "vitest";
import { createApp } from "../../src/app";
import { getDb } from "../../src/db";
import { createTestAgent } from "../helpers/request";

const app = createApp();
const agent = createTestAgent(app);

describe("GET /api/saved-gigs", () => {
  beforeEach(async () => {
    const db = getDb({ mode: "write" });
    await db.deleteFrom("saved_gigs").execute();
  });

  it("should return empty results if user has no saved gigs", async () => {
    const res = await agent.get("/api/saved-gigs", {
      token: "user-2-token",
    });

    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it("should return saved gigs with joins and support list filtering", async () => {
    // User 2 (Bob) saves Gig 1 (posted by Alice) to Watchlist
    await agent.post("/api/gigs/1/save", {
      token: "user-2-token",
      body: { list: "WATCHLIST", note: "Watchlist note" },
    });

    // User 2 (Bob) saves Gig 3 (posted by Charlie) to Shortlist
    await agent.post("/api/gigs/3/save", {
      token: "user-2-token",
      body: { list: "SHORTLIST", note: "Shortlist note" },
    });

    // Fetch without filters
    const res = await agent.get("/api/saved-gigs", {
      token: "user-2-token",
    });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.items.length).toBe(2);

    // Verify ordering is newest first (Gig 3 was saved second, so it should be first in results)
    expect(res.body.items[0].gig_id).toBe(3);
    expect(res.body.items[0].list).toBe("SHORTLIST");
    expect(res.body.items[0].note).toBe("Shortlist note");
    expect(res.body.items[0].gig_title).toContain("Local Flyer Distribution");
    expect(res.body.items[0].gig_status).toBe("open");

    expect(res.body.items[1].gig_id).toBe(1);
    expect(res.body.items[1].list).toBe("WATCHLIST");
    expect(res.body.items[1].note).toBe("Watchlist note");

    // Fetch with list filter = SHORTLIST
    const filterRes = await agent.get("/api/saved-gigs?list=SHORTLIST", {
      token: "user-2-token",
    });

    expect(filterRes.status).toBe(200);
    expect(filterRes.body.total).toBe(1);
    expect(filterRes.body.items[0].gig_id).toBe(3);
  });

  it("should support pagination (limit and offset)", async () => {
    // User 2 saves Gig 1, Gig 3, Gig 4 (posted by Alice)
    await agent.post("/api/gigs/1/save", {
      token: "user-2-token",
      body: { list: "WATCHLIST" },
    });

    await agent.post("/api/gigs/3/save", {
      token: "user-2-token",
      body: { list: "SHORTLIST" },
    });

    await agent.post("/api/gigs/4/save", {
      token: "user-2-token",
      body: { list: "APPLY_LATER" },
    });

    // Get page 1 (limit 2)
    const page1 = await agent.get("/api/saved-gigs?limit=2&offset=0", {
      token: "user-2-token",
    });

    expect(page1.status).toBe(200);
    expect(page1.body.total).toBe(3);
    expect(page1.body.items.length).toBe(2);

    // Get page 2 (limit 2, offset 2)
    const page2 = await agent.get("/api/saved-gigs?limit=2&offset=2", {
      token: "user-2-token",
    });

    expect(page2.status).toBe(200);
    expect(page2.body.total).toBe(3);
    expect(page2.body.items.length).toBe(1);
  });

  it("should return 401 when no token is provided", async () => {
    const res = await agent.get("/api/saved-gigs");

    expect(res.status).toBe(401);
  });
});
