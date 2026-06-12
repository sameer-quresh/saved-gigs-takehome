import cors from "cors";
import express, { type Express } from "express";
import { errorHandler } from "./lib/error-handler";
import { authMiddleware } from "./middleware/auth";
import { gigsRouter, savedGigsRouter } from "./routes";

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(authMiddleware);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/gigs", gigsRouter);
  app.use("/api/saved-gigs", savedGigsRouter);

  app.use(errorHandler);

  return app;
}
