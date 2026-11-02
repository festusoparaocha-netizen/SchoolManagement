import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function checkEnrollmentRecords(studentId, schoolClassId, academicSessionId) {
  const [student, schoolClass, academicSession] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId } }),
    prisma.schoolClass.findUnique({ where: { id: schoolClassId } }),
    prisma.academicSession.findUnique({ where: { id: academicSessionId } }),
  ]);

  if (!student) {
    throw createError("Student not found", 404);
  }

  if (student.status !== "ACTIVE") {
    throw createError("This student is not active and cannot be enrolled", 400);
  }

  if (!schoolClass) {
    throw createError("School class not found", 404);
  }

  if (!academicSession) {
    throw createError("Academic session not found", 404);
  }
}

const enrollmentInclude = {
  student: {
    select: {
      id: true,
      admissionNumber: true,
      user: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
  },
  schoolClass: {
    select: {
      id: true,
      name: true,
      level: true,
    },
  },
  academicSession: {
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      isCurrent: true,
    },
  },
};

export async function createEnrollment(data) {
  await checkEnrollmentRecords(
    data.studentId,
    data.schoolClassId,
    data.academicSessionId
  );

  try {
    return await prisma.classEnrollment.create({
      data: {
        studentId: data.studentId,
        schoolClassId: data.schoolClassId,
        academicSessionId: data.academicSessionId,
      },
      include: enrollmentInclude,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw createError(
        "This student is already enrolled in an academic session",
        409
      );
    }

    throw error;
  }
}

export async function listEnrollments({
  page = 1,
  limit = 10,
  studentId,
  schoolClassId,
  academicSessionId,
}) {
  const where = {
    ...(studentId && { studentId }),
    ...(schoolClassId && { schoolClassId }),
    ...(academicSessionId && { academicSessionId }),
  };

  const [enrollments, total] = await prisma.$transaction([
    prisma.classEnrollment.findMany({
      where,
      include: enrollmentInclude,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.classEnrollment.count({ where }),
  ]);

  return {
    enrollments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getEnrollmentById(id) {
  const enrollment = await prisma.classEnrollment.findUnique({
    where: { id },
    include: enrollmentInclude,
  });

  if (!enrollment) {
    throw createError("Enrollment not found", 404);
  }

  return enrollment;
}

export async function updateEnrollment(id, data) {
  const existing = await getEnrollmentById(id);

  const schoolClass = await prisma.schoolClass.findUnique({
    where: { id: data.schoolClassId },
  });

  if (!schoolClass) {
    throw createError("School class not found", 404);
  }

  try {
    return await prisma.classEnrollment.update({
      where: { id: existing.id },
      data: {
        schoolClassId: data.schoolClassId,
      },
      include: enrollmentInclude,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw createError("Enrollment not found", 404);
    }

    throw error;
  }
}