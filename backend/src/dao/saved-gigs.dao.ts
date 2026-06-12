import type { GigStatus, SavedList } from "shared";
import { getDb } from "../db";

export interface SavedGigRecord {
  id: number;
  user_id: number;
  gig_id: number;
  list: SavedList;
  note: string | null;
  created_on: Date;
  updated_on: Date;
}

export interface SavedGigWithGigRecord extends SavedGigRecord {
  gig_title: string;
  gig_status: GigStatus;
}

export interface UpsertSavedGigParams {
  userId: number;
  gigId: number;
  list: SavedList;
  note: string | null;
}

export interface ListSavedGigsParams {
  userId: number;
  offset: number;
  limit: number;
  list?: SavedList;
}

export interface ListSavedGigsResult {
  items: SavedGigWithGigRecord[];
  total: number;
}

export const savedGigsDao = {
  async upsert(params: UpsertSavedGigParams): Promise<SavedGigRecord | undefined> {
    const db = getDb({ mode: "write" });
    const { userId, gigId, list, note } = params;

    const row = await db
      .insertInto("saved_gigs")
      .values({
        user_id: userId,
        gig_id: gigId,
        list,
        note,
      })
      .onConflict((oc) =>
        oc.columns(["user_id", "gig_id"]).doUpdateSet({
          list,
          note,
          updated_on: new Date(),
        }),
      )
      .returningAll()
      .executeTakeFirst();

    if (!row) {
      return undefined;
    }

    return {
      ...row,
      list: row.list as SavedList,
    };
  },

  async deleteByUserAndGig(userId: number, gigId: number): Promise<void> {
    const db = getDb({ mode: "write" });
    await db
      .deleteFrom("saved_gigs")
      .where("user_id", "=", userId)
      .where("gig_id", "=", gigId)
      .execute();
  },

  async list(params: ListSavedGigsParams): Promise<ListSavedGigsResult> {
    const db = getDb({ mode: "read" });
    const { userId, offset, limit, list } = params;

    let query = db
      .selectFrom("saved_gigs")
      .innerJoin("gigs", "gigs.id", "saved_gigs.gig_id")
      .select([
        "saved_gigs.id",
        "saved_gigs.user_id",
        "saved_gigs.gig_id",
        "saved_gigs.list",
        "saved_gigs.note",
        "saved_gigs.created_on",
        "saved_gigs.updated_on",
        "gigs.title as gig_title",
        "gigs.status as gig_status",
        (eb) => eb.fn.countAll().over().as("total"),
      ])
      .where("saved_gigs.user_id", "=", userId);

    if (list) {
      query = query.where("saved_gigs.list", "=", list);
    }

    const rows = await query
      .orderBy("saved_gigs.created_on", "desc")
      .offset(offset)
      .limit(limit)
      .execute();

    const items = rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      gig_id: row.gig_id,
      list: row.list as SavedList,
      note: row.note,
      created_on: row.created_on,
      updated_on: row.updated_on,
      gig_title: row.gig_title,
      gig_status: row.gig_status as GigStatus,
    }));

    const total = rows.length > 0 ? Number(rows[0].total) : 0;

    return { items, total };
  },
};
