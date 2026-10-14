
import app from "./app.js";
import { env } from "./config/env.js";
import prisma from "./lib/prisma.js";

let server;

async function startServer() {
  try {
    await prisma.$connect();

    console.log("Connected to PostgreSQL successfully.");

    server = app.listen(env.PORT, () => {
      console.log(
        `School Management API running at http://localhost:${env.PORT}`
      );
    });
  } catch (error) {
    console.error("Failed to start the application:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

async function shutdown() {
  console.log("Shutting down the server...");

  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  } else {
    await prisma.$disconnect();
    process.exit(0);
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer();