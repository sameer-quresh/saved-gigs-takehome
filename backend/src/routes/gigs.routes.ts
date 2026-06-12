import { Router, type IRouter } from "express";
import { PERMISSIONS } from "shared";
import * as gigsController from "../controllers/gigs.controller";
import * as savedGigsController from "../controllers/saved-gigs.controller";
import { apiWrapper } from "../lib/api-wrapper";
import { allowPermission } from "../middleware/allow-permission";

export const gigsRouter: IRouter = Router();

gigsRouter.get(
  "/",
  allowPermission(PERMISSIONS.READ_SAVED_GIG),
  apiWrapper(gigsController.listGigs),
);

gigsRouter.post(
  "/:gigId/save",
  allowPermission(PERMISSIONS.CREATE_SAVED_GIG),
  apiWrapper(savedGigsController.saveGig),
);

gigsRouter.delete(
  "/:gigId/save",
  allowPermission(PERMISSIONS.DELETE_SAVED_GIG),
  apiWrapper(savedGigsController.unsaveGig),
);
