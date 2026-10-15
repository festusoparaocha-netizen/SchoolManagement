
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function generateToken(user) {
  return jwt.sign(
    { sub: user.id },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: "school-management-api",
      audience: "school-management-portal"
    }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: "school-management-api",
    audience: "school-management-portal"
  });
}
