
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";

function createError(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

function handleDatabaseError(error) {
  if (error.code === "P2002") {
    throw createError(
      "The email address or staff number is already in use.",
      409
    );
  }

  if (error.code === "P2025") {
    throw createError("Teacher record not found.", 404);
  }

  throw error;
}

const teacherInclude = {
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      status: true
    }
  }
};

export async function createTeacher(data) {
  try {
    const passwordHash = await bcrypt.hash(data.password, 12);

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          passwordHash,
          role: "TEACHER",
          status: "ACTIVE"
        }
      });

      return tx.teacher.create({
        data: {
          userId: user.id,
          staffNumber: data.staffNumber,
          qualification: data.qualification,
          employmentDate: data.employmentDate
        },
        include: teacherInclude
      });
    });
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function listTeachers({
  page = 1,
  limit = 10,
  search,
  status = "ACTIVE"
}) {
  const where = {};

  if (status !== "ALL") {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { staffNumber: { contains: search, mode: "insensitive" } },
      {
        user: {
          is: {
            fullName: { contains: search, mode: "insensitive" }
          }
        }
      },
      {
        user: {
          is: {
            email: { contains: search, mode: "insensitive" }
          }
        }
      }
    ];
  }

  const [teachers, total] = await prisma.$transaction([
    prisma.teacher.findMany({
      where,
      include: teacherInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.teacher.count({ where })
  ]);

  return {
    teachers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getTeacherById(id) {
  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: teacherInclude
  });

  if (!teacher) {
    throw createError("Teacher record not found.", 404);
  }

  return teacher;
}

export async function updateTeacher(id, data) {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.teacher.findUnique({
        where: { id },
        select: { id: true, userId: true }
      });

      if (!existing) {
        throw createError("Teacher record not found.", 404);
      }

      const teacherData = {};

      for (const field of [
        "staffNumber",
        "qualification",
        "employmentDate"
      ]) {
        if (data[field] !== undefined) {
          teacherData[field] = data[field];
        }
      }

      if (Object.keys(teacherData).length > 0) {
        await tx.teacher.update({
          where: { id },
          data: teacherData
        });
      }

      const userData = {};

      if (data.fullName !== undefined) {
        userData.fullName = data.fullName;
      }

      if (data.email !== undefined) {
        userData.email = data.email;
      }

      if (Object.keys(userData).length > 0 && existing.userId) {
        await tx.user.update({
          where: { id: existing.userId },
          data: userData
        });
      }

      return tx.teacher.findUnique({
        where: { id },
        include: teacherInclude
      });
    });
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function deactivateTeacher(id) {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.teacher.findUnique({
        where: { id },
        select: { id: true, userId: true }
      });

      if (!existing) {
        throw createError("Teacher record not found.", 404);
      }

      const teacher = await tx.teacher.update({
        where: { id },
        data: { status: "INACTIVE" },
        include: teacherInclude
      });

      if (existing.userId) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { status: "INACTIVE" }
        });
      }

      return teacher;
    });
  } catch (error) {
    handleDatabaseError(error);
  }
}
