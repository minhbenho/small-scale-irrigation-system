import express from "express";
import routes from "./routes/index.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/health", (req, res) => res.json({ ok: true }));

  console.log("📌 Registering API routes...");
  app.use(routes);
  console.log("✅ Routes registered successfully");

  app.use(notFound);
  app.use(errorHandler);

  return app;
}