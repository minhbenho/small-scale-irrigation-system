import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  // ssl: false, // local thường không cần
});

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