import { z } from "zod";

const assessmentTypes = [
  "ASSIGNMENT",
  "TEST",
  "EXAM",
  "OTHER",
];

export const createAssessmentSchema = z.object({
  title: z.string().trim().min(3).max(150),
  type: z.enum(assessmentTypes),
  maxScore: z.coerce.number().positive().max(99999.99),
  assessmentDate: z.coerce.date().optional(),
  schoolClassId: z.string().uuid("Invalid class ID"),
  subjectId: z.string().uuid("Invalid subject ID"),
  academicSessionId: z.string().uuid("Invalid academic session ID"),
  term: z.coerce.number().int().min(1).max(3),
}).strict();

export const updateAssessmentSchema = z.object({
  title: z.string().trim().min(3).max(150).optional(),
  type: z.enum(assessmentTypes).optional(),
  maxScore: z.coerce.number().positive().max(99999.99).optional(),
  assessmentDate: z.coerce.date().nullable().optional(),
  term: z.coerce.number().int().min(1).max(3).optional(),
}).strict().refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: "Provide at least one field to update" }
);

export const assessmentIdSchema = z.object({
  id: z.string().uuid("Invalid assessment ID"),
});

export const listAssessmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  schoolClassId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  academicSessionId: z.string().uuid().optional(),
  type: z.enum(assessmentTypes).optional(),
  term: z.coerce.number().int().min(1).max(3).optional(),
});