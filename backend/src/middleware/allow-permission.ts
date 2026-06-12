import type { NextFunction, Request, Response } from "express";
import type { Permission } from "shared";

export function allowPermission(...required: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.sendStatus(401);
      return;
    }

    if (
      required.length > 0 &&
      !required.some((permission) => req.user!.permissions.includes(permission))
    ) {
      res.sendStatus(403);
      return;
    }

    next();
  };
}
