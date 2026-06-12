import type { Request, Response } from "express";
import { schema, type SavedList } from "shared";
import { savedGigsService } from "../services/saved-gigs.service";
import { ErrorStatus } from "../errors/error-status";

export async function saveGig(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ErrorStatus("Unauthorized", 401);
  }

  // 1. Validate inputs (Path params and body data) using TypeBox schema
  const validated = schema.savedGigs.save.validate(req);
  const { params: { gigId }, body: { list, note } } = validated;

  // 2. Delegate to the service layer (which checks all business rules)
  const { record, isUpdate } = await savedGigsService.saveGig({
    userId: req.user.id,
    gigId,
    list: (list as SavedList | undefined) ?? "WATCHLIST",
    note: note ?? null,
  });

  // 3. Return 200 for updates, 201 for new bookmarks
  if (isUpdate) {
    res.status(200).json(record);
  } else {
    res.status(201).json(record);
  }
}

export async function unsaveGig(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ErrorStatus("Unauthorized", 401);
  }

  // 1. Validate inputs (Path parameter)
  const { params: { gigId } } = schema.savedGigs.delete.validate(req);

  // 2. Delegate delete to service
  await savedGigsService.unsaveGig(req.user.id, gigId);

  // 3. Return success 204 (idempotent no-content response)
  res.sendStatus(204);
}

export async function listSavedGigs(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new ErrorStatus("Unauthorized", 401);
  }

  // 1. Validate inputs (Query parameters)
  const { query: { offset, limit, list } } = schema.savedGigs.list.validate(req);

  // 2. Delegate query to service
  const result = await savedGigsService.listSavedGigs({
    userId: req.user.id,
    offset: offset ?? 0,
    limit: limit ?? 20,
    list: list as SavedList | undefined,
  });

  res.json(result);
}
