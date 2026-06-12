import "dotenv/config";
import { getDb, destroyDb } from "../src/db";

async function seed(): Promise<void> {
  const db = getDb({ mode: "write" });
  console.log("Seeding database...");

  // Truncate tables first to ensure clean state and restart identity sequences
  await db.deleteFrom("saved_gigs").execute();
  await db.deleteFrom("gigs").execute();
  await db.deleteFrom("users").execute();

  // Reset serial IDs in PostgreSQL so that IDs start at 1 consistently for tests
  await db.introspection.getTables();
  const tables = ["users", "gigs", "saved_gigs"];
  for (const table of tables) {
    // Kysely doesn't have a direct helper to restart sequences in query builder, raw sql works well
    await db.executeQuery({
      sql: `ALTER SEQUENCE ${table}_id_seq RESTART WITH 1`,
      parameters: [],
      query: { kind: "SelectQuery" }, // dummy query kind
    });
  }

  // Seed users
  const seededUsers = await db
    .insertInto("users")
    .values([
      { name: "Alice Smith", email: "alice@example.com" },
      { name: "Bob Jones", email: "bob@example.com" },
      { name: "Charlie Brown", email: "charlie@example.com" },
    ])
    .returning(["id", "name"])
    .execute();

  const aliceId = seededUsers.find((u) => u.name.includes("Alice"))!.id;
  const bobId = seededUsers.find((u) => u.name.includes("Bob"))!.id;
  const charlieId = seededUsers.find((u) => u.name.includes("Charlie"))!.id;

  // Seed gigs (~17 gigs)
  const gigs = [
    { title: "React Frontend Help", description: "Fix some layout issues in Tailwind CSS.", budget_amount: 5000, mode: "online", status: "open", posted_by: aliceId },
    { title: "Backend API Integration", description: "Design a Node.js Kysely database query builder layer.", budget_amount: 15000, mode: "online", status: "open", posted_by: bobId },
    { title: "Local Flyer Distribution", description: "Distribute marketing flyers around downtown.", budget_amount: 8000, mode: "offline", status: "open", posted_by: charlieId },
    { title: "Database Performance Audit", description: "Analyze slow queries on Postgres database using EXPLAIN.", budget_amount: 30000, mode: "online", status: "open", posted_by: aliceId },
    { title: "Office Chair Assembly", description: "Assemble 10 office chairs in our headquarters.", budget_amount: 10000, mode: "offline", status: "open", posted_by: bobId },
    { title: "Closed Gig: Logo Design", description: "Create a modern logo for our startup.", budget_amount: 12000, mode: "online", status: "closed", posted_by: aliceId },
    { title: "Closed Gig: Local Moving Help", description: "Help move furniture to a new apartment.", budget_amount: 25000, mode: "offline", status: "closed", posted_by: bobId },
    { title: "Technical Writing", description: "Write documentation for an Express monorepo API.", budget_amount: 9000, mode: "online", status: "open", posted_by: charlieId },
    { title: "SEO Optimization", description: "Analyze and implement metadata and semantic HTML updates.", budget_amount: 11000, mode: "online", status: "open", posted_by: aliceId },
    { title: "Product Photography", description: "Take clean product photos for e-commerce website.", budget_amount: 20000, mode: "offline", status: "open", posted_by: bobId },
    { title: "Mobile App Wireframing", description: "Create Figma wireframes for an iOS/Android application.", budget_amount: 18000, mode: "online", status: "open", posted_by: charlieId },
    { title: "Dog Walking", description: "Walk two friendly golden retrievers daily for a week.", budget_amount: 7000, mode: "offline", status: "open", posted_by: aliceId },
    { title: "Vitest Testing Coverage", description: "Add backend integration tests using Vitest.", budget_amount: 13000, mode: "online", status: "open", posted_by: bobId },
    { title: "Translation: English to Spanish", description: "Translate a 2000 word landing page copy.", budget_amount: 6000, mode: "online", status: "open", posted_by: charlieId },
    { title: "Local Event Setup", description: "Help set up stages and audio equipment for a conference.", budget_amount: 15000, mode: "offline", status: "open", posted_by: aliceId },
    { title: "TypeScript Migration Assist", description: "Help migrate an old JavaScript API to strict TypeScript.", budget_amount: 14000, mode: "online", status: "open", posted_by: bobId },
    { title: "Closed Gig: Garden Cleanup", description: "Mow lawn, trim hedges, and clean weeds.", budget_amount: 9500, mode: "offline", status: "closed", posted_by: charlieId }
  ];

  await db.insertInto("gigs").values(gigs).execute();

  console.log("Database seeded successfully!");
  await destroyDb();
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

