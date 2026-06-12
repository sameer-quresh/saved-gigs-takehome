import type { GigStatus } from "shared";
import { getDb } from "../db";

export interface GigRecord {
  id: number;
  title: string;
  description: string;
  budget_amount: number;
  mode: string;
  status: GigStatus;
  posted_by: number;
  created_on: Date;
  updated_on: Date;
}

export interface ListGigsParams {
  offset: number;
  limit: number;
  userId: number;
}

export interface ListGigsResult {
  items: Array<GigRecord & { is_saved: boolean }>;
  total: number;
}

export const gigsDao = {
  async findById(id: number): Promise<GigRecord | undefined> {
    const db = getDb({ mode: "read" });
    const gig = await db
      .selectFrom("gigs")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!gig) {
      return undefined;
    }

    return {
      ...gig,
      status: gig.status as GigStatus,
    };
  },

  async listOpen(params: ListGigsParams): Promise<ListGigsResult> {
    const db = getDb({ mode: "read" });
    const { offset, limit, userId } = params;

    const rows = await db
      .selectFrom("gigs")
      .leftJoin("saved_gigs", (join) =>
        join
          .onRef("saved_gigs.gig_id", "=", "gigs.id")
          .on("saved_gigs.user_id", "=", userId),
      )
      .select([
        "gigs.id",
        "gigs.title",
        "gigs.description",
        "gigs.budget_amount",
        "gigs.mode",
        "gigs.status",
        "gigs.posted_by",
        "gigs.created_on",
        "gigs.updated_on",
        "saved_gigs.id as saved_gig_id",
        (eb) => eb.fn.countAll().over().as("total"),
      ])
      .where("gigs.status", "=", "open")
      .orderBy("gigs.created_on", "desc")
      .offset(offset)
      .limit(limit)
      .execute();

    const items = rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      budget_amount: row.budget_amount,
      mode: row.mode,
      status: row.status as GigStatus,
      posted_by: row.posted_by,
      created_on: row.created_on,
      updated_on: row.updated_on,
      is_saved: row.saved_gig_id !== null,
    }));

    const total = rows.length > 0 ? Number(rows[0].total) : 0;

    return { items, total };
  },
};
