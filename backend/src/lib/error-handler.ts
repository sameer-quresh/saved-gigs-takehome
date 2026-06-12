import type { NextFunction, Request, Response } from "express";
import { ValidationError } from "shared";
import { ErrorStatus } from "../errors/error-status";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ErrorStatus) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  if (err instanceof ValidationError) {
    res.status(400).json({ message: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ message: "Internal Server Error" });
}
