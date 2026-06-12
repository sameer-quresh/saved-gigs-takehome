import { getDb } from "../db";

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  created_on: Date;
  updated_on: Date;
}

export const usersDao = {
  async findById(id: number): Promise<UserRecord | undefined> {
    const db = getDb({ mode: "read" });
    const user = await db
      .selectFrom("users")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    return user;
  },
};
