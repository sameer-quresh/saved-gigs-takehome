import { Router, type IRouter } from "express";
import { PERMISSIONS } from "shared";
import * as savedGigsController from "../controllers/saved-gigs.controller";
import { apiWrapper } from "../lib/api-wrapper";
import { allowPermission } from "../middleware/allow-permission";

export const savedGigsRouter: IRouter = Router();

savedGigsRouter.get(
  "/",
  allowPermission(PERMISSIONS.READ_SAVED_GIG),
  apiWrapper(savedGigsController.listSavedGigs),
);
