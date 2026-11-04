-- CreateEnum
CREATE TYPE "ReportCardStatus" AS ENUM ('DRAFT', 'APPROVED', 'PUBLISHED');

-- CreateTable
CREATE TABLE "ReportCard" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolClassId" TEXT NOT NULL,
    "academicSessionId" TEXT NOT NULL,
    "term" INTEGER NOT NULL,
    "totalScore" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "maximumScore" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "average" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "position" INTEGER,
    "teacherComment" TEXT,
    "administratorRemark" TEXT,
    "status" "ReportCardStatus" NOT NULL DEFAULT 'DRAFT',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportCardSubject" (
    "id" TEXT NOT NULL,
    "reportCardId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "totalScore" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "maximumScore" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "average" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "grade" TEXT,
    "teacherComment" TEXT,
    "commentedByTeacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportCardSubject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportCard_schoolClassId_academicSessionId_term_idx" ON "ReportCard"("schoolClassId", "academicSessionId", "term");

-- CreateIndex
CREATE INDEX "ReportCard_studentId_academicSessionId_term_idx" ON "ReportCard"("studentId", "academicSessionId", "term");

-- CreateIndex
CREATE INDEX "ReportCard_status_idx" ON "ReportCard"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ReportCard_studentId_schoolClassId_academicSessionId_term_key" ON "ReportCard"("studentId", "schoolClassId", "academicSessionId", "term");

-- CreateIndex
CREATE INDEX "ReportCardSubject_subjectId_idx" ON "ReportCardSubject"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportCardSubject_reportCardId_subjectId_key" ON "ReportCardSubject"("reportCardId", "subjectId");

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_schoolClassId_fkey" FOREIGN KEY ("schoolClassId") REFERENCES "SchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_academicSessionId_fkey" FOREIGN KEY ("academicSessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCardSubject" ADD CONSTRAINT "ReportCardSubject_reportCardId_fkey" FOREIGN KEY ("reportCardId") REFERENCES "ReportCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCardSubject" ADD CONSTRAINT "ReportCardSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCardSubject" ADD CONSTRAINT "ReportCardSubject_commentedByTeacherId_fkey" FOREIGN KEY ("commentedByTeacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
