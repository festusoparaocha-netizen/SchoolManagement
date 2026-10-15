
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import { generateToken } from "../utils/jwt.js";

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  // Use the same response for an unknown email and a wrong password.
  if (!user) {
    throw Object.assign(new Error("Invalid email or password"), {
      status: 401
    });
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw Object.assign(new Error("Invalid email or password"), {
      status: 401
    });
  }

  if (user.status !== "ACTIVE") {
    throw Object.assign(new Error("This account is not active"), {
      status: 403
    });
  }

  const token = generateToken(user);

  // Never return the password hash.
  return {
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status
    }
  };
}
