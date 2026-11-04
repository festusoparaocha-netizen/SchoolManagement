
import { z } from "zod";

// Generate report cards for a class, academic session and term.
export const generateReportCardsSchema = z.object({
  schoolClassId: z.string().uuid("A valid school class ID is required"),

  academicSessionId: z
    .string()
    .uuid("A valid academic session ID is required"),

  term: z.coerce
    .number()
    .int("Term must be a whole number")
    .min(1, "Term must be at least 1")
    .max(3, "Term cannot exceed 3")
});

// Validate report-card ID in route parameters.
export const reportCardIdSchema = z.object({
  id: z.string().uuid("A valid report card ID is required")
});

// Validate report-card listing filters.
export const listReportCardsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce.number().int().positive().max(100).default(10),

  studentId: z.string().uuid().optional(),

  schoolClassId: z.string().uuid().optional(),

  academicSessionId: z.string().uuid().optional(),

  term: z.coerce.number().int().min(1).max(3).optional(),

  status: z.enum(["DRAFT", "APPROVED", "PUBLISHED"]).optional()
});
