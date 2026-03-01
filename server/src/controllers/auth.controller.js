import { registerUser, loginUser } from "../services/auth.service.js";

export const register = (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate
    if (!email || !password) {
      return res.status(400).json({
        message: "email and password are required",
        code: "INVALID_REQUEST",
      });
    }

    const user = registerUser(email, password, name);
    res.status(201).json({
      user,
      message: "User registered successfully",
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      code: "REGISTRATION_FAILED",
    });
  }
};

export const login = (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate
    if (!email || !password) {
      return res.status(400).json({
        message: "email and password are required",
        code: "INVALID_REQUEST",
      });
    }

    const result = loginUser(email, password);
    res.status(200).json(result);
  } catch (error) {
    return res.status(401).json({
      message: error.message,
      code: "LOGIN_FAILED",
    });
  }
};
