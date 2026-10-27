
import prisma from "../lib/prisma.js";

function createError(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

function handleDatabaseError(error) {
  if (error.code === "P2002") {
    throw createError(
      "A class with this name and level already exists.",
      409
    );
  }

  if (error.code === "P2025") {
    throw createError("Class not found.", 404);
  }

  throw error;
}

export async function createClass(data) {
  try {
    return await prisma.schoolClass.create({ data });
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function listClasses({ page = 1, limit = 10, search, status = "ACTIVE" }) {
  const where = {};

  if (status !== "ALL") {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { level: { contains: search, mode: "insensitive" } }
    ];
  }

  const [classes, total] = await prisma.$transaction([
    prisma.schoolClass.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.schoolClass.count({ where })
  ]);

  return {
    classes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getClassById(id) {
  const schoolClass = await prisma.schoolClass.findUnique({
    where: { id }
  });

  if (!schoolClass) {
    throw createError("Class not found.", 404);
  }

  return schoolClass;
}

export async function updateClass(id, data) {
  try {
    return await prisma.schoolClass.update({
      where: { id },
      data
    });
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function deactivateClass(id) {
  try {
    return await prisma.schoolClass.update({
      where: { id },
      data: { status: "INACTIVE" }
    });
  } catch (error) {
    handleDatabaseError(error);
  }
}
