import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const connectionPool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: "postgres",
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

async function resetDatabase() {
  const client = await connectionPool.connect();
  try {
    console.log("⏳ Disconnecting active connections...");
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${process.env.PGDATABASE}'
      AND pid <> pg_backend_pid()
    `);
    
    console.log("⏳ Dropping existing database...");
    await client.query(`DROP DATABASE IF EXISTS ${process.env.PGDATABASE}`);
    console.log("✅ Database dropped");

    console.log("⏳ Creating new database...");
    await client.query(`CREATE DATABASE ${process.env.PGDATABASE}`);
    console.log("✅ Database created");

    console.log("✅ Database reset complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await connectionPool.end();
  }
}

resetDatabase();
