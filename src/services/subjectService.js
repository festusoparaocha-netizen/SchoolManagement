
import prisma from "../lib/prisma.js";

function createError(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

function handleDatabaseError(error) {
  if (error.code === "P2002") {
    throw createError(
      "A subject with this code already exists.",
      409
    );
  }

  if (error.code === "P2025") {
    throw createError("Subject not found.", 404);
  }

  throw error;
}

export async function createSubject(data) {
  try {
    return await prisma.subject.create({ data });
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function listSubjects({ page = 1, limit = 10, search }) {
  const where = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } }
    ];
  }

  const [subjects, total] = await prisma.$transaction([
    prisma.subject.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.subject.count({ where })
  ]);

  return {
    subjects,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getSubjectById(id) {
  const subject = await prisma.subject.findUnique({
    where: { id }
  });

  if (!subject) {
    throw createError("Subject not found.", 404);
  }

  return subject;
}

export async function updateSubject(id, data) {
  try {
    return await prisma.subject.update({
      where: { id },
      data
    });
  } catch (error) {
    handleDatabaseError(error);
  }
}
