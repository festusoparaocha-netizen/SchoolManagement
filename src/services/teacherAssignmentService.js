import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function checkAssignmentRecords(data) {
  const [teacher, schoolClass, subject, academicSession] =
    await Promise.all([
      data.teacherId
        ? prisma.teacher.findUnique({
            where: { id: data.teacherId },
          })
        : null,

      data.schoolClassId
        ? prisma.schoolClass.findUnique({
            where: { id: data.schoolClassId },
          })
        : null,

      data.subjectId
        ? prisma.subject.findUnique({
            where: { id: data.subjectId },
          })
        : null,

      data.academicSessionId
        ? prisma.academicSession.findUnique({
            where: { id: data.academicSessionId },
          })
        : null,
    ]);

  if (data.teacherId && !teacher) {
    throw createError("Teacher not found", 404);
  }

  if (teacher && teacher.status !== "ACTIVE") {
    throw createError("Inactive or suspended teachers cannot be assigned", 400);
  }

  if (data.schoolClassId && !schoolClass) {
    throw createError("School class not found", 404);
  }

  if (
    schoolClass &&
    schoolClass.status !== undefined &&
    schoolClass.status !== "ACTIVE"
  ) {
    throw createError("Inactive school classes cannot receive assignments", 400);
  }

  if (data.subjectId && !subject) {
    throw createError("Subject not found", 404);
  }

  if (data.academicSessionId && !academicSession) {
    throw createError("Academic session not found", 404);
  }
}

const assignmentInclude = {
  teacher: {
    select: {
      id: true,
      staffNumber: true,
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
  subject: {
    select: {
      id: true,
      name: true,
      code: true,
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

export async function createTeacherAssignment(data) {
  await checkAssignmentRecords(data);

  try {
    return await prisma.teacherAssignment.create({
      data: {
        teacherId: data.teacherId,
        schoolClassId: data.schoolClassId,
        subjectId: data.subjectId,
        academicSessionId: data.academicSessionId,
      },
      include: assignmentInclude,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw createError(
        "This teacher assignment already exists",
        409
      );
    }

    throw error;
  }
}

export async function listTeacherAssignments({
  page = 1,
  limit = 10,
  teacherId,
  schoolClassId,
  subjectId,
  academicSessionId,
}) {
  const where = {
    ...(teacherId && { teacherId }),
    ...(schoolClassId && { schoolClassId }),
    ...(subjectId && { subjectId }),
    ...(academicSessionId && { academicSessionId }),
  };

  const [assignments, total] = await prisma.$transaction([
    prisma.teacherAssignment.findMany({
      where,
      include: assignmentInclude,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),

    prisma.teacherAssignment.count({ where }),
  ]);

  return {
    assignments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTeacherAssignmentById(id) {
  const assignment = await prisma.teacherAssignment.findUnique({
    where: { id },
    include: assignmentInclude,
  });

  if (!assignment) {
    throw createError("Teacher assignment not found", 404);
  }

  return assignment;
}

export async function updateTeacherAssignment(id, data) {
  const existing = await getTeacherAssignmentById(id);

  const updatedData = {
    teacherId: data.teacherId ?? existing.teacherId,
    schoolClassId: data.schoolClassId ?? existing.schoolClassId,
    subjectId: data.subjectId ?? existing.subjectId,
    academicSessionId:
      data.academicSessionId ?? existing.academicSessionId,
  };

  await checkAssignmentRecords(updatedData);

  try {
    return await prisma.teacherAssignment.update({
      where: { id },
      data: updatedData,
      include: assignmentInclude,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw createError(
        "The updated teacher assignment already exists",
        409
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw createError("Teacher assignment not found", 404);
    }

    throw error;
  }
}

export async function deleteTeacherAssignment(id) {
  await getTeacherAssignmentById(id);

  return prisma.teacherAssignment.delete({
    where: { id },
  });
}