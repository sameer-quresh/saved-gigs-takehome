import type { NextFunction, Request, Response } from "express";
import { findUserByToken } from "../auth/tokens";

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  const user = findUserByToken(token);
  if (user) {
    req.user = user;
  }

  next();
}
