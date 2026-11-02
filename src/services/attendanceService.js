import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const attendanceInclude = {
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
    },
  },
  recordedBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
    },
  },
};

async function checkTeacherAssignment(userId, schoolClassId, academicSessionId) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
  });

  if (!teacher || teacher.status !== "ACTIVE") {
    throw createError("Active teacher profile not found", 403);
  }

  const assignment = await prisma.teacherAssignment.findFirst({
    where: {
      teacherId: teacher.id,
      schoolClassId,
      academicSessionId,
    },
  });

  if (!assignment) {
    throw createError(
      "You are not assigned to this class for this academic session",
      403
    );
  }
}

async function checkAttendanceRecords(data, user) {
  const [student, schoolClass, academicSession] = await Promise.all([
    prisma.student.findUnique({ where: { id: data.studentId } }),
    prisma.schoolClass.findUnique({ where: { id: data.schoolClassId } }),
    prisma.academicSession.findUnique({
      where: { id: data.academicSessionId },
    }),
  ]);

const attendanceDate = data.date.toISOString().slice(0, 10);
const sessionStart = academicSession.startDate.toISOString().slice(0, 10);
const sessionEnd = academicSession.endDate.toISOString().slice(0, 10);

if (attendanceDate < sessionStart || attendanceDate > sessionEnd) {
  throw createError(
    "Attendance date must fall within the selected academic session",
    400
  );
}
    
  if (!student) {
    throw createError("Student not found", 404);
  }

  if (student.status !== "ACTIVE") {
    throw createError("Inactive or suspended students cannot have attendance recorded", 400);
  }

  if (!schoolClass) {
    throw createError("School class not found", 404);
  }

  if (schoolClass.status && schoolClass.status !== "ACTIVE") {
    throw createError("Attendance cannot be recorded for an inactive class", 400);
  }

  if (!academicSession) {
    throw createError("Academic session not found", 404);
  }

  const enrollment = await prisma.classEnrollment.findFirst({
    where: {
      studentId: data.studentId,
      schoolClassId: data.schoolClassId,
      academicSessionId: data.academicSessionId,
    },
  });

  if (!enrollment) {
    throw createError(
      "This student is not enrolled in the selected class and academic session",
      400
    );
  }

  if (user.role === "TEACHER") {
    await checkTeacherAssignment(
      user.id,
      data.schoolClassId,
      data.academicSessionId
    );
  }
}

function buildDate(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function createAttendance(data, user) {
  await checkAttendanceRecords(data, user);

  try {
    return await prisma.attendance.create({
      data: {
        studentId: data.studentId,
        schoolClassId: data.schoolClassId,
        academicSessionId: data.academicSessionId,
        recordedById: user.id,
        date: data.date,
        status: data.status,
        remarks: data.remarks,
      },
      include: attendanceInclude,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw createError(
        "Attendance has already been recorded for this student, class, session, and date",
        409
      );
    }

    throw error;
  }
}

export async function listAttendance(filters, user) {
  const {
    page = 1,
    limit = 10,
    studentId,
    schoolClassId,
    academicSessionId,
    status,
    date,
    startDate,
    endDate,
  } = filters;

  const where = {
    ...(studentId && { studentId }),
    ...(schoolClassId && { schoolClassId }),
    ...(academicSessionId && { academicSessionId }),
    ...(status && { status }),
    ...(date && { date: buildDate(date) }),
    ...(startDate || endDate
      ? {
          date: {
            ...(startDate && { gte: buildDate(startDate) }),
            ...(endDate && { lte: buildDate(endDate) }),
          },
        }
      : {}),
  };

  // Teachers can only view attendance for their assigned classes/sessions.
  if (user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
    });

    if (!teacher || teacher.status !== "ACTIVE") {
      throw createError("Active teacher profile not found", 403);
    }

    const assignments = await prisma.teacherAssignment.findMany({
      where: { teacherId: teacher.id },
      select: {
        schoolClassId: true,
        academicSessionId: true,
      },
    });

    if (assignments.length === 0) {
      return {
        attendance: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }

    where.OR = assignments.map((assignment) => ({
      schoolClassId: assignment.schoolClassId,
      academicSessionId: assignment.academicSessionId,
    }));
  }

  const [records, total] = await prisma.$transaction([
    prisma.attendance.findMany({
      where,
      include: attendanceInclude,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: "desc" },
    }),
    prisma.attendance.count({ where }),
  ]);

  return {
    attendance: records,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAttendanceById(id, user) {
  const record = await prisma.attendance.findUnique({
    where: { id },
    include: attendanceInclude,
  });

  if (!record) {
    throw createError("Attendance record not found", 404);
  }

  if (user.role === "TEACHER") {
    await checkTeacherAssignment(
      user.id,
      record.schoolClassId,
      record.academicSessionId
    );
  }

  return record;
}

export async function updateAttendance(id, data, user) {
  const existing = await getAttendanceById(id, user);

  try {
    return await prisma.attendance.update({
      where: { id: existing.id },
      data,
      include: attendanceInclude,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw createError("Attendance record not found", 404);
    }

    throw error;
  }
}
