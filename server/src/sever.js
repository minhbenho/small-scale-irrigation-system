import express from "express";
import { pool, checkDb } from "./db.js";
import { createApp } from "./app.js";

const app = createApp();

// Health check endpoint
app.get("/health", async (req, res) => {
  const r = await pool.query("SELECT 1 as ok");
  res.json({ ok: r.rows[0].ok });
});

// Database test endpoints (optional)
app.get("/users", async (req, res) => {
  const r = await pool.query("SELECT id, name FROM users ORDER BY id DESC");
  res.json(r.rows);
});

app.post("/users", async (req, res) => {
  const { name } = req.body;
  const r = await pool.query(
    "INSERT INTO users(name) VALUES($1) RETURNING id, name",
    [name]
  );
  res.status(201).json(r.rows[0]);
});

const PORT = 3000;
app.listen(PORT, async () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  await checkDb();
});