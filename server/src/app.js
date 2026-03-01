import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import routes from "./routes/index.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(express.static(publicDir));

  app.get("/health", (req, res) => res.json({ ok: true }));

  console.log("📌 Registering API routes...");
  app.use(routes);
  console.log("✅ Routes registered successfully");

  app.get("/", (req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}