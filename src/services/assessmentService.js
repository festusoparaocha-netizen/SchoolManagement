import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const assessmentInclude = {
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
    },
  },
};

async function checkAssessmentRecords(data, user) {
  const [schoolClass, subject, academicSession] = await Promise.all([
    prisma.schoolClass.findUnique({
      where: { id: data.schoolClassId },
    }),
    prisma.subject.findUnique({
      where: { id: data.subjectId },
    }),
    prisma.academicSession.findUnique({
      where: { id: data.academicSessionId },
    }),
  ]);

  if (!schoolClass) {
    throw createError("School class not found", 404);
  }

  if (!subject) {
    throw createError("Subject not found", 404);
  }

  if (!academicSession) {
    throw createError("Academic session not found", 404);
  }

  if (
    data.assessmentDate &&
    (data.assessmentDate < academicSession.startDate ||
      data.assessmentDate > academicSession.endDate)
  ) {
    throw createError(
      "Assessment date must fall within the academic session",
      400
    );
  }

  if (user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
    });

    if (!teacher || teacher.status !== "ACTIVE") {
      throw createError("Active teacher profile not found", 403);
    }

    const assignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: teacher.id,
        schoolClassId: data.schoolClassId,
        subjectId: data.subjectId,
        academicSessionId: data.academicSessionId,
      },
    });

    if (!assignment) {
      throw createError(
        "You are not assigned to teach this subject in this class and session",
        403
      );
    }
  }
}

export async function createAssessment(data, user) {
  await checkAssessmentRecords(data, user);

  return prisma.assessment.create({
    data: {
      title: data.title,
      type: data.type,
      maxScore: data.maxScore,
      assessmentDate: data.assessmentDate,
      schoolClassId: data.schoolClassId,
      subjectId: data.subjectId,
      academicSessionId: data.academicSessionId,
      term: data.term,
    },
    include: assessmentInclude,
  });
}

export async function listAssessments(filters, user) {
  const {
    page = 1,
    limit = 10,
    schoolClassId,
    subjectId,
    academicSessionId,
    type,
    term,
  } = filters;

  const where = {
    ...(schoolClassId && { schoolClassId }),
    ...(subjectId && { subjectId }),
    ...(academicSessionId && { academicSessionId }),
    ...(type && { type }),
    ...(term && { term }),
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
        assessments: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }

    where.OR = assignments.map((assignment) => ({
      schoolClassId: assignment.schoolClassId,
      subjectId: assignment.subjectId,
      academicSessionId: assignment.academicSessionId,
    }));
  }

  const [assessments, total] = await prisma.$transaction([
    prisma.assessment.findMany({
      where,
      include: assessmentInclude,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.assessment.count({ where }),
  ]);

  return {
    assessments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAssessmentById(id, user) {
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: assessmentInclude,
  });

  if (!assessment) {
    throw createError("Assessment not found", 404);
  }

  if (user.role === "TEACHER") {
    await checkAssessmentRecords(
      {
        schoolClassId: assessment.schoolClassId,
        subjectId: assessment.subjectId,
        academicSessionId: assessment.academicSessionId,
      },
      user
    );
  }

  return assessment;
}

export async function updateAssessment(id, data, user) {
  const existing = await getAssessmentById(id, user);

  // Do not change the maximum score after results have been entered.
  if (data.maxScore !== undefined) {
    const resultCount = await prisma.result.count({
      where: { assessmentId: id },
    });

    if (resultCount > 0) {
      throw createError(
        "Maximum score cannot be changed after student results have been recorded",
        400
      );
    }
  }

  return prisma.assessment.update({
    where: { id: existing.id },
    data,
    include: assessmentInclude,
  });
}