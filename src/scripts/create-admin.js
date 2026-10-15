
import "dotenv/config";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../lib/prisma.js";

const bootstrapSchema = z.object({
  BOOTSTRAP_ADMIN_NAME: z.string().trim().min(2),
  BOOTSTRAP_ADMIN_EMAIL: z.string().trim().email(),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().min(12).max(128)
});

async function main() {
  const parsed = bootstrapSchema.safeParse({
    BOOTSTRAP_ADMIN_NAME: process.env.BOOTSTRAP_ADMIN_NAME,
    BOOTSTRAP_ADMIN_EMAIL: process.env.BOOTSTRAP_ADMIN_EMAIL,
    BOOTSTRAP_ADMIN_PASSWORD: process.env.BOOTSTRAP_ADMIN_PASSWORD
  });

  if (!parsed.success) {
    throw new Error(
      "Set a valid admin name, email, and password in your environment."
    );
  }

  const { BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL,
    BOOTSTRAP_ADMIN_PASSWORD } = parsed.data;

  const email = BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email }
  });

  if (existing) {
    throw new Error(
      "That email already exists. No account or role was changed."
    );
  }

  const passwordHash = await bcrypt.hash(
    BOOTSTRAP_ADMIN_PASSWORD,
    12
  );

  const admin = await prisma.user.create({
    data: {
      fullName: BOOTSTRAP_ADMIN_NAME,
      email,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE"
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true
    }
  });

  console.log("Administrator created successfully:", admin);
}

main()
  .catch((error) => {
    console.error("Administrator setup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
