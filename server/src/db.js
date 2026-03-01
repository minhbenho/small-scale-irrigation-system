import pg from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

// Initialize database schema on startup
export async function initializeDb() {
  try {
    const initSqlPath = path.join(__dirname, "db", "init.sql");
    const initSql = fs.readFileSync(initSqlPath, "utf8");
    
    const client = await pool.connect();
    try {
      // Split on ; and execute each statement
      const statements = initSql
        .split(";")
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        await client.query(statement);
      }
      
      console.log("✅ Database schema initialized");
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Database initialization error:", error.message);
    throw error;
  }
}

// Kiểm tra kết nối ngay khi start server (tùy bạn)
export async function checkDb() {
  const client = await pool.connect();
  try {
    const r = await client.query("SELECT NOW() as now");
    console.log("✅ DB connected:", r.rows[0].now);
  } finally {
    client.release();
  }
}