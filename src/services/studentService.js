
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";

function createError(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

function handleDatabaseError(error) {
  if (error.code === "P2002") {
    throw createError(
      "The email address or admission number is already in use.",
      409
    );
  }

  if (error.code === "P2025") {
    throw createError("Student record not found.", 404);
  }

  throw error;
}

const studentInclude = {
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

export async function createStudent(data) {
  try {
    const passwordHash = await bcrypt.hash(data.password, 12);

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          passwordHash,
          role: "STUDENT",
          status: "ACTIVE"
        }
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          admissionNumber: data.admissionNumber,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          address: data.address
        },
        include: studentInclude
      });

      return student;
    });
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function listStudents({ page = 1, limit = 10, search, status = "ACTIVE" }) {
  const where = {};

  if (status !== "ALL") {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { admissionNumber: { contains: search, mode: "insensitive" } },
      { user: { is: { fullName: { contains: search, mode: "insensitive" } } } },
      { user: { is: { email: { contains: search, mode: "insensitive" } } } }
    ];
  }

  const [students, total] = await prisma.$transaction([
    prisma.student.findMany({
      where,
      include: studentInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.student.count({ where })
  ]);

  return {
    students,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getStudentById(id) {
  const student = await prisma.student.findUnique({
    where: { id },
    include: studentInclude
  });

  if (!student) {
    throw createError("Student record not found.", 404);
  }

  return student;
}

export async function updateStudent(id, data) {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.student.findUnique({
        where: { id },
        include: { user: true }
      });

      if (!existing) {
        throw createError("Student record not found.", 404);
      }

      const studentData = {};
      for (const field of ["admissionNumber", "dateOfBirth", "gender", "address"]) {
        if (data[field] !== undefined) {
          studentData[field] = data[field];
        }
      }

      if (Object.keys(studentData).length > 0) {
        await tx.student.update({
          where: { id },
          data: studentData
        });
      }

      const userData = {};
      if (data.fullName !== undefined) userData.fullName = data.fullName;
      if (data.email !== undefined) userData.email = data.email;

      if (Object.keys(userData).length > 0 && existing.userId) {
        await tx.user.update({
          where: { id: existing.userId },
          data: userData
        });
      }

      return tx.student.findUnique({
        where: { id },
        include: studentInclude
      });
    });
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function deactivateStudent(id) {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.student.findUnique({
        where: { id },
        select: { id: true, userId: true, status: true }
      });

      if (!existing) {
        throw createError("Student record not found.", 404);
      }

      const student = await tx.student.update({
        where: { id },
        data: { status: "INACTIVE" },
        include: studentInclude
      });

      if (existing.userId) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { status: "INACTIVE" }
        });
      }

      return student;
    });
  } catch (error) {
    handleDatabaseError(error);
  }
}
