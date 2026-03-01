import { generateToken } from "../utils/jwt.js";

// In a real application, you would query the database
// For now, we'll use a simple in-memory store for demo purposes
const users = new Map();

export function registerUser(email, password, name) {
  // Check if user already exists
  if (users.has(email)) {
    throw new Error("User already exists");
  }

  const userId = "user-" + Date.now();
  const user = {
    id: userId,
    email,
    password, // In production, this should be hashed with bcrypt
    name: name || email.split("@")[0],
    createdAt: new Date(),
  };

  users.set(email, user);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

export function loginUser(email, password) {
  const user = users.get(email);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.password !== password) {
    throw new Error("Invalid password");
  }

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
}

export function getUserById(userId) {
  for (const user of users.values()) {
    if (user.id === userId) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
      };
    }
  }
  return null;
}
