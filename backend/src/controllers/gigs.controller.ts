import type { Request, Response } from "express";
import { schema } from "shared";
import { gigsDao } from "../dao/gigs.dao";
import { ErrorStatus } from "../errors/error-status";

export async function listGigs(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ErrorStatus("Unauthorized", 401);
  }

  // Validate request query parameters using the TypeBox schema
  const { query: { offset, limit } } = schema.gigs.list.validate(req);

  const result = await gigsDao.listOpen({
    offset: offset ?? 0,
    limit: limit ?? 20,
    userId: req.user.id,
  });

  res.json(result);
}

