import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";

export function generateToken(payload, expiresIn = "24h") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

export function decodeToken(token) {
  return jwt.decode(token);
}
