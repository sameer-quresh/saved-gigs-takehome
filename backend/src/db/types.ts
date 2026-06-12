import type { ColumnType, Generated } from "kysely";

export interface UsersTable {
  id: Generated<number>;
  name: string;
  email: string;
  created_on: ColumnType<Date, Date | undefined, Date | undefined>;
  updated_on: ColumnType<Date, Date | undefined, Date | undefined>;
}

export interface GigsTable {
  id: Generated<number>;
  title: string;
  description: string;
  budget_amount: number;
  mode: string;
  status: string;
  posted_by: number;
  created_on: ColumnType<Date, Date | undefined, Date | undefined>;
  updated_on: ColumnType<Date, Date | undefined, Date | undefined>;
}

export interface SavedGigsTable {
  id: Generated<number>;
  user_id: number;
  gig_id: number;
  list: string;
  note: string | null;
  created_on: ColumnType<Date, Date | undefined, Date | undefined>;
  updated_on: ColumnType<Date, Date | undefined, Date | undefined>;
}

export interface Database {
  users: UsersTable;
  gigs: GigsTable;
  saved_gigs: SavedGigsTable;
}
