import { verifyToken } from "../utils/jwt.js";

export function requireJwt(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists
    if (!authHeader) {
      return res.status(401).json({
        error: "Authorization header is missing",
      });
    }

    // Extract token from "Bearer {token}"
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        error: "Invalid authorization header format. Use: Bearer {token}",
      });
    }

    const token = parts[1];

    // Verify token and extract user data
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired token",
      details: error.message,
    });
  }
}