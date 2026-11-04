
import prisma from "../lib/prisma.js";

// Standard grading scale.
// These boundaries can be adjusted to match your school's policy.
export function calculateGrade(percentage) {
  if (percentage >= 70) return "A";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 45) return "D";
  if (percentage >= 40) return "E";
  return "F";
}

// Round numbers to two decimal places.
function roundToTwo(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Standardize errors so controllers can handle them.
function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Relations returned with a report card.
const reportCardInclude = {
  student: {
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      }
    }
  },
  schoolClass: true,
  academicSession: true,
  subjects: {
    include: {
      subject: true,
      commentedByTeacher: {
        select: {
          id: true,
          staffNumber: true
        }
      }
    },
    orderBy: {
      subject: {
        name: "asc"
      }
    }
  }
};

// Generate report cards for all active students enrolled
// in a particular class, academic session and term.
export async function generateReportCards({
  schoolClassId,
  academicSessionId,
  term
}) {
  // 1. Confirm that the class exists.
  const schoolClass = await prisma.schoolClass.findUnique({
    where: { id: schoolClassId }
  });

  if (!schoolClass) {
    throw createError("School class not found", 404);
  }

  // 2. Confirm that the academic session exists.
  const academicSession = await prisma.academicSession.findUnique({
    where: { id: academicSessionId }
  });

  if (!academicSession) {
    throw createError("Academic session not found", 404);
  }

  // 3. Retrieve active students enrolled in this class and session.
  const enrollments = await prisma.classEnrollment.findMany({
    where: {
      schoolClassId,
      academicSessionId,
      student: {
        status: "ACTIVE"
      }
    },
    include: {
      student: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      }
    }
  });

  if (enrollments.length === 0) {
    throw createError(
      "No active students are enrolled in this class and academic session",
      404
    );
  }

  // 4. Retrieve assessments and eligible student results.
  // DRAFT and SUBMITTED results are deliberately excluded.
  const assessments = await prisma.assessment.findMany({
    where: {
      schoolClassId,
      academicSessionId,
      term
    },
    include: {
      subject: true,
      results: {
        where: {
          status: {
            in: ["APPROVED", "PUBLISHED"]
          }
        },
        select: {
          id: true,
          studentId: true,
          score: true,
          status: true
        }
      }
    }
  });

  // 5. Prepare a score collection for every enrolled student.
  const studentScores = new Map();

  for (const enrollment of enrollments) {
    studentScores.set(enrollment.studentId, {
      student: enrollment.student,
      subjects: new Map()
    });
  }

  // 6. Group approved assessment results by student and subject.
  for (const assessment of assessments) {
    const subjectId = assessment.subjectId;
    const subjectName = assessment.subject.name;
    const maximumScore = Number(assessment.maxScore);

    for (const result of assessment.results) {
      const studentData = studentScores.get(result.studentId);

      // Ignore results for students not enrolled in this class.
      if (!studentData) continue;

      if (!studentData.subjects.has(subjectId)) {
        studentData.subjects.set(subjectId, {
          subjectId,
          subjectName,
          totalScore: 0,
          maximumScore: 0
        });
      }

      const subjectData = studentData.subjects.get(subjectId);

      subjectData.totalScore += Number(result.score);
      subjectData.maximumScore += maximumScore;
    }
  }

  // 7. Calculate subject totals, averages and grades.
  const preparedReports = [];

  for (const [studentId, studentData] of studentScores) {
    const subjectReports = [];

    let overallTotalScore = 0;
    let overallMaximumScore = 0;

    for (const subjectData of studentData.subjects.values()) {
      const totalScore = roundToTwo(subjectData.totalScore);
      const maximumScore = roundToTwo(subjectData.maximumScore);

      const average =
        maximumScore > 0
          ? roundToTwo((totalScore / maximumScore) * 100)
          : 0;

      subjectReports.push({
        subjectId: subjectData.subjectId,
        totalScore,
        maximumScore,
        average,
        grade: calculateGrade(average)
      });

      overallTotalScore += totalScore;
      overallMaximumScore += maximumScore;
    }

    overallTotalScore = roundToTwo(overallTotalScore);
    overallMaximumScore = roundToTwo(overallMaximumScore);

    const overallAverage =
      overallMaximumScore > 0
        ? roundToTwo(
            (overallTotalScore / overallMaximumScore) * 100
          )
        : 0;

    preparedReports.push({
      studentId,
      totalScore: overallTotalScore,
      maximumScore: overallMaximumScore,
      average: overallAverage,
      subjects: subjectReports
    });
  }

  // 8. Save report cards and subject breakdowns.
  // Existing approved or published report cards cannot be regenerated.
  const reportCards = await prisma.$transaction(async (tx) => {
    const existingReports = await tx.reportCard.findMany({
      where: {
        schoolClassId,
        academicSessionId,
        term,
        studentId: {
          in: preparedReports.map((report) => report.studentId)
        }
      },
      select: {
        studentId: true,
        status: true
      }
    });

    const lockedReport = existingReports.find(
      (report) => report.status !== "DRAFT"
    );

    if (lockedReport) {
      throw createError(
        "Some report cards have already been approved or published. They cannot be regenerated.",
        409
      );
    }

    const savedReports = [];

    for (const report of preparedReports) {
      const subjectCreateData = report.subjects.map((subject) => ({
        subjectId: subject.subjectId,
        totalScore: subject.totalScore,
        maximumScore: subject.maximumScore,
        average: subject.average,
        grade: subject.grade
      }));

      const savedReport = await tx.reportCard.upsert({
        where: {
          studentId_schoolClassId_academicSessionId_term: {
            studentId: report.studentId,
            schoolClassId,
            academicSessionId,
            term
          }
        },

        update: {
          totalScore: report.totalScore,
          maximumScore: report.maximumScore,
          average: report.average,
          position: null,
          generatedAt: new Date(),

          subjects: {
            deleteMany: {},
            create: subjectCreateData
          }
        },

        create: {
          studentId: report.studentId,
          schoolClassId,
          academicSessionId,
          term,
          totalScore: report.totalScore,
          maximumScore: report.maximumScore,
          average: report.average,
          status: "DRAFT",

          subjects: {
            create: subjectCreateData
          }
        },

        select: {
          id: true,
          studentId: true,
          average: true,
          totalScore: true
        }
      });

      savedReports.push(savedReport);
    }

    // 9. Rank students by overall average.
    // Equal averages receive equal positions (1, 1, 3).
    const rankedReports = [...savedReports].sort((a, b) => {
      const averageDifference =
        Number(b.average) - Number(a.average);

      if (averageDifference !== 0) {
        return averageDifference;
      }

      return Number(b.totalScore) - Number(a.totalScore);
    });

    let previousAverage = null;
    let previousPosition = null;

    for (let index = 0; index < rankedReports.length; index++) {
      const report = rankedReports[index];
      const currentAverage = roundToTwo(Number(report.average));

      const position =
        previousAverage !== null &&
        currentAverage === previousAverage
          ? previousPosition
          : index + 1;

      await tx.reportCard.update({
        where: {
          id: report.id
        },
        data: {
          position
        }
      });

      previousAverage = currentAverage;
      previousPosition = position;
    }

    // 10. Return the generated report cards with their details.
    return tx.reportCard.findMany({
      where: {
        schoolClassId,
        academicSessionId,
        term
      },
      include: reportCardInclude,
      orderBy: [
        { position: "asc" },
        { student: { admissionNumber: "asc" } }
      ]
    });
  });

  return {
    count: reportCards.length,
    schoolClass: schoolClass.name,
    academicSession: academicSession.name,
    term,
    reportCards
  };
}


// Retrieve report cards using pagination and optional filters.
export async function listReportCards({
  page = 1,
  limit = 10,
  studentId,
  schoolClassId,
  academicSessionId,
  term,
  status
}) {
  const skip = (page - 1) * limit;

  const where = {
    ...(studentId && { studentId }),
    ...(schoolClassId && { schoolClassId }),
    ...(academicSessionId && { academicSessionId }),
    ...(term !== undefined && { term }),
    ...(status && { status })
  };

  const [reportCards, total] = await prisma.$transaction([
    prisma.reportCard.findMany({
      where,
      skip,
      take: limit,
      include: reportCardInclude,
      orderBy: [
        { academicSession: { startDate: "desc" } },
        { term: "desc" },
        { position: "asc" }
      ]
    }),

    prisma.reportCard.count({ where })
  ]);

  return {
    reportCards,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

// Retrieve one report card by its ID.
export async function getReportCardById(id) {
  const reportCard = await prisma.reportCard.findUnique({
    where: { id },
    include: reportCardInclude
  });

  if (!reportCard) {
    throw createError("Report card not found", 404);
  }

  return reportCard;
}
