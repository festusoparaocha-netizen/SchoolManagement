
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";

export async function createAcademicSession(data) {
  try {
    return await prisma.academicSession.create({
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const conflict = new Error(
        "An academic session with this name already exists"
      );
      conflict.statusCode = 409;
      throw conflict;
    }

    throw error;
  }
}

export async function listAcademicSessions({
  page = 1,
  limit = 10,
  search,
}) {
  const where = search
    ? {
        name: {
          contains: search,
          mode: "insensitive",
        },
      }
    : {};

  const [sessions, total] = await prisma.$transaction([
    prisma.academicSession.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { startDate: "desc" },
    }),
    prisma.academicSession.count({ where }),
  ]);

  return {
    sessions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAcademicSessionById(id) {
  const session = await prisma.academicSession.findUnique({
    where: { id },
  });

  if (!session) {
    const error = new Error("Academic session not found");
    error.statusCode = 404;
    throw error;
  }

  return session;
}

export async function updateAcademicSession(id, data) {
  const existing = await getAcademicSessionById(id);

  const startDate = data.startDate ?? existing.startDate;
  const endDate = data.endDate ?? existing.endDate;

  if (startDate >= endDate) {
    const error = new Error(
      "End date must be after start date"
    );
    error.statusCode = 400;
    throw error;
  }

  try {
    return await prisma.academicSession.update({
      where: { id },
      data,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const conflict = new Error(
        "An academic session with this name already exists"
      );
      conflict.statusCode = 409;
      throw conflict;
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      const notFound = new Error("Academic session not found");
      notFound.statusCode = 404;
      throw notFound;
    }

    throw error;
  }
}

export async function setCurrentAcademicSession(id) {
  // Confirm the requested session exists before changing any records.
  await getAcademicSessionById(id);

  // Clear the current flag and set the chosen session in one transaction.
  return prisma.$transaction(async (tx) => {
    await tx.academicSession.updateMany({
      where: { isCurrent: true },
      data: { isCurrent: false },
    });

    return tx.academicSession.update({
      where: { id },
      data: { isCurrent: true },
    });
  });
}
