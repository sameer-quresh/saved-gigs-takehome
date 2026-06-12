import { getDb } from "../db";
import { gigsDao } from "../dao/gigs.dao";
import { savedGigsDao } from "../dao/saved-gigs.dao";
import { ErrorStatus } from "../errors/error-status";
import type {
  SavedGigRecord,
  UpsertSavedGigParams,
  ListSavedGigsParams,
  ListSavedGigsResult,
} from "../dao/saved-gigs.dao";

export const savedGigsService = {
  async saveGig(
    params: UpsertSavedGigParams,
  ): Promise<{ record: SavedGigRecord; isUpdate: boolean }> {
    const { userId, gigId } = params;

    // 1. Retrieve gig details. Throw 404 if not found.
    const gig = await gigsDao.findById(gigId);
    if (!gig) {
      throw new ErrorStatus("Gig not found", 404);
    }

    // 2. Business Rule: A user cannot save their own gig
    if (gig.posted_by === userId) {
      throw new ErrorStatus("You cannot save your own gig", 400);
    }

    // 3. Business Rule: A closed gig cannot be saved
    if (gig.status === "closed") {
      throw new ErrorStatus("You cannot save a closed gig", 400);
    }

    // Check if the record already exists to classify as insert (201) vs update (200)
    const db = getDb({ mode: "read" });
    const existing = await db
      .selectFrom("saved_gigs")
      .select("id")
      .where("user_id", "=", userId)
      .where("gig_id", "=", gigId)
      .executeTakeFirst();

    const isUpdate = !!existing;

    // 4. Perform Kysely idempotent upsert
    const record = await savedGigsDao.upsert(params);
    if (!record) {
      throw new ErrorStatus("Failed to save gig", 500);
    }

    return { record, isUpdate };
  },

  async unsaveGig(userId: number, gigId: number): Promise<void> {
    // Business Rule: Delete is idempotent.
    // If user attempts to delete a bookmark that does not exist, it completes as a success no-op.
    await savedGigsDao.deleteByUserAndGig(userId, gigId);
  },

  async listSavedGigs(params: ListSavedGigsParams): Promise<ListSavedGigsResult> {
    return savedGigsDao.list(params);
  },
};
