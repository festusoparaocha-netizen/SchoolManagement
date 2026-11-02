import { z } from "zod";

export const createEnrollmentSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  schoolClassId: z.string().uuid("Invalid school class ID"),
  academicSessionId: z.string().uuid("Invalid academic session ID"),
}).strict();

export const updateEnrollmentSchema = z.object({
  schoolClassId: z.string().uuid("Invalid school class ID"),
}).strict();

export const enrollmentIdSchema = z.object({
  id: z.string().uuid("Invalid enrollment ID"),
});

export const listEnrollmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  studentId: z.string().uuid().optional(),
  schoolClassId: z.string().uuid().optional(),
  academicSessionId: z.string().uuid().optional(),
});