import pg from "pg";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

function hashSecret(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function seedTestDevice() {
  const client = await pool.connect();
  try {
    console.log("🌱 Seeding test user and device...\n");

    // 1. Create test user if not exists
    console.log("1️⃣  Creating test user...");
    const userEmail = "test@test.com";
    const userPassword = "test123";
    const userName = "Test User";
    const passwordHash = hashPassword(userPassword);

    let userResult = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [userEmail]
    );

    let userId;
    if (userResult.rows.length === 0) {
      userResult = await client.query(
        "INSERT INTO users(email, password_hash, name) VALUES($1, $2, $3) RETURNING id",
        [userEmail, passwordHash, userName]
      );
      userId = userResult.rows[0].id;
      console.log(`   ✅ Created user: ${userEmail} (ID: ${userId})`);
      console.log(`   📧 Email: ${userEmail}`);
      console.log(`   🔑 Password: ${userPassword}\n`);
    } else {
      userId = userResult.rows[0].id;
      console.log(`   ℹ️  User already exists: ${userEmail} (ID: ${userId})\n`);
    }

    // 2. Create test device
    console.log("2️⃣  Creating test device...");
    const deviceCode = "esp32-01";
    const deviceSecret = "abc123";
    const displayName = "ESP32 Test Device";
    const secretHash = hashSecret(deviceSecret);

    // Check if device exists
    let deviceResult = await client.query(
      "SELECT id FROM devices WHERE device_code = $1",
      [deviceCode]
    );

    if (deviceResult.rows.length === 0) {
      deviceResult = await client.query(
        `INSERT INTO devices(
          user_id, device_code, display_name, device_secret_hash,
          threshold_moisture, mode, min_pump_off_sec, max_pump_on_sec
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [userId, deviceCode, displayName, secretHash, 45, "AUTO", 300, 120]
      );
      const deviceId = deviceResult.rows[0].id;
      console.log(`   ✅ Created device: ${deviceCode} (ID: ${deviceId})`);
      console.log(`   📟 Device Code: ${deviceCode}`);
      console.log(`   🔐 Device Secret: ${deviceSecret}`);
      console.log(`   🔒 Secret Hash: ${secretHash}\n`);
    } else {
      // Update existing device
      await client.query(
        `UPDATE devices SET 
          device_secret_hash = $1,
          display_name = $2,
          user_id = $3,
          is_active = true
        WHERE device_code = $4`,
        [secretHash, displayName, userId, deviceCode]
      );
      const deviceId = deviceResult.rows[0].id;
      console.log(`   ✅ Updated existing device: ${deviceCode} (ID: ${deviceId})`);
      console.log(`   📟 Device Code: ${deviceCode}`);
      console.log(`   🔐 Device Secret: ${deviceSecret}`);
      console.log(`   🔒 Secret Hash: ${secretHash}\n`);
    }

    console.log("✅ Seed completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`   User Email: ${userEmail}`);
    console.log(`   User Password: ${userPassword}`);
    console.log(`   Device Code: ${deviceCode}`);
    console.log(`   Device Secret: ${deviceSecret}`);
    console.log(`\n🔌 ESP32 is now ready to connect!`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedTestDevice();
