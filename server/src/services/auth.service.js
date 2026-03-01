import { generateToken } from "../utils/jwt.js";
import { pool } from "../db.js";
import crypto from "crypto";

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function registerUser(email, password, name) {
  const emailLower = String(email || "").toLowerCase().trim();
  const passwordHash = hashPassword(password);
  const nameStr = String(name || "").trim() || emailLower.split("@")[0];

  try {
    // Check if user already exists
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [emailLower]);
    if (existing.rows.length > 0) {
      throw new Error("User already exists");
    }

    // Insert new user
    const result = await pool.query(
      "INSERT INTO users(email, password_hash, name) VALUES($1, $2, $3) RETURNING id, email, name",
      [emailLower, passwordHash, nameStr]
    );

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  } catch (error) {
    throw error;
  }
}

export async function loginUser(email, password) {
  const emailLower = String(email || "").toLowerCase().trim();
  const passwordHash = hashPassword(password);

  try {
    const result = await pool.query(
      "SELECT id, email, name FROM users WHERE email = $1 AND password_hash = $2",
      [emailLower, passwordHash]
    );

    if (result.rows.length === 0) {
      throw new Error("Invalid email or password");
    }

    const user = result.rows[0];
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  } catch (error) {
    throw error;
  }
}

export async function getUserById(userId) {
  try {
    const result = await pool.query(
      "SELECT id, email, name FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  } catch (error) {
    throw error;
  }
}