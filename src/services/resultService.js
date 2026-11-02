import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const resultInclude = {
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
  assessment: {
    include: {
      schoolClass: {
        select: { id: true, name: true, level: true },
      },
      subject: {
        select: { id: true, name: true, code: true },
      },
      academicSession: {
        select: { id: true, name: true },
      },
    },
  },
  enteredBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
    },
  },
};

async function checkTeacherAccess(assessment, user) {
  if (user.role !== "TEACHER") return;

  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id },
  });

  if (!teacher || teacher.status !== "ACTIVE") {
    throw createError("Active teacher profile not found", 403);
  }

  const assignment = await prisma.teacherAssignment.findFirst({
    where: {
      teacherId: teacher.id,
      schoolClassId: assessment.schoolClassId,
      subjectId: assessment.subjectId,
      academicSessionId: assessment.academicSessionId,
    },
  });

  if (!assignment) {
    throw createError(
      "You are not assigned to this assessment",
      403
    );
  }
}

async function getAssessmentAndCheckStudent(studentId, assessmentId, user) {
  const [student, assessment] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
    }),
    prisma.assessment.findUnique({
      where: { id: assessmentId },
    }),
  ]);

  if (!student) {
    throw createError("Student not found", 404);
  }

  if (student.status !== "ACTIVE") {
    throw createError(
      "Inactive or suspended students cannot receive new results",
      400
    );
  }

  if (!assessment) {
    throw createError("Assessment not found", 404);
  }

  await checkTeacherAccess(assessment, user);

  const enrollment = await prisma.classEnrollment.findFirst({
    where: {
      studentId,
      schoolClassId: assessment.schoolClassId,
      academicSessionId: assessment.academicSessionId,
    },
  });

  if (!enrollment) {
    throw createError(
      "Student is not enrolled in the assessment's class and academic session",
      400
    );
  }

  return { student, assessment };
}

export async function createResult(data, user) {
  const { assessment } = await getAssessmentAndCheckStudent(
    data.studentId,
    data.assessmentId,
    user
  );

  if (data.score > Number(assessment.maxScore)) {
    throw createError(
      `Score cannot exceed the maximum score of ${assessment.maxScore}`,
      400
    );
  }

  try {
    return await prisma.result.create({
      data: {
        studentId: data.studentId,
        assessmentId: data.assessmentId,
        enteredById: user.id,
        score: data.score,
        grade: data.grade,
        remarks: data.remarks,
        status: "DRAFT",
      },
      include: resultInclude,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw createError(
        "A result already exists for this student and assessment",
        409
      );
    }

    throw error;
  }
}

export async function listResults(filters, user) {
  const {
    page = 1,
    limit = 10,
    studentId,
    assessmentId,
    status,
  } = filters;

  const where = {
    ...(studentId && { studentId }),
    ...(assessmentId && { assessmentId }),
    ...(status && { status }),
  };

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
        subjectId: true,
        academicSessionId: true,
      },
    });

    if (assignments.length === 0) {
      return {
        results: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }

    where.OR = assignments.map((assignment) => ({
      assessment: {
        schoolClassId: assignment.schoolClassId,
        subjectId: assignment.subjectId,
        academicSessionId: assignment.academicSessionId,
      },
    }));
  }

  const [results, total] = await prisma.$transaction([
    prisma.result.findMany({
      where,
      include: resultInclude,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.result.count({ where }),
  ]);

  return {
    results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getResultById(id, user) {
  const result = await prisma.result.findUnique({
    where: { id },
    include: resultInclude,
  });

  if (!result) {
    throw createError("Result not found", 404);
  }

  await checkTeacherAccess(result.assessment, user);

  return result;
}

export async function updateResult(id, data, user) {
  const existing = await getResultById(id, user);

  if (existing.status !== "DRAFT") {
    throw createError(
      "Only draft results can be edited",
      400
    );
  }

  const newScore = data.score ?? Number(existing.score);

  if (newScore > Number(existing.assessment.maxScore)) {
    throw createError(
      `Score cannot exceed the maximum score of ${existing.assessment.maxScore}`,
      400
    );
  }

  return prisma.result.update({
    where: { id },
    data,
    include: resultInclude,
  });
}

export async function submitResult(id, user) {
  const existing = await getResultById(id, user);

  if (existing.status !== "DRAFT") {
    throw createError(
      "Only draft results can be submitted",
      400
    );
  }

  return prisma.result.update({
    where: { id },
    data: { status: "SUBMITTED" },
    include: resultInclude,
  });
}

export async function approveResult(id) {
  const existing = await prisma.result.findUnique({
    where: { id },
  });

  if (!existing) {
    throw createError("Result not found", 404);
  }

  if (existing.status !== "SUBMITTED") {
    throw createError(
      "Only submitted results can be approved",
      400
    );
  }

  return prisma.result.update({
    where: { id },
    data: { status: "APPROVED" },
    include: resultInclude,
  });
}

export async function publishResult(id) {
  const existing = await prisma.result.findUnique({
    where: { id },
  });

  if (!existing) {
    throw createError("Result not found", 404);
  }

  if (existing.status !== "APPROVED") {
    throw createError(
      "Only approved results can be published",
      400
    );
  }

  return prisma.result.update({
    where: { id },
    data: { status: "PUBLISHED" },
    include: resultInclude,
  });
}