import { z } from "zod";

export const createResultSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  assessmentId: z.string().uuid("Invalid assessment ID"),
  score: z.coerce.number().min(0).max(99999.99),
  grade: z.string().trim().max(5).optional(),
  remarks: z.string().trim().max(500).optional(),
}).strict();

export const updateResultSchema = z.object({
  score: z.coerce.number().min(0).max(99999.99).optional(),
  grade: z.string().trim().max(5).nullable().optional(),
  remarks: z.string().trim().max(500).nullable().optional(),
}).strict().refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: "Provide at least one field to update" }
);

export const resultIdSchema = z.object({
  id: z.string().uuid("Invalid result ID"),
});

export const listResultsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  studentId: z.string().uuid().optional(),
  assessmentId: z.string().uuid().optional(),
  status: z.enum([
    "DRAFT",
    "SUBMITTED",
    "APPROVED",
    "PUBLISHED",
  ]).optional(),
});