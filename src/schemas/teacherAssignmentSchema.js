import { z } from "zod";

const assignmentFields = {
  teacherId: z.string().uuid("Invalid teacher ID"),
  schoolClassId: z.string().uuid("Invalid school class ID"),
  subjectId: z.string().uuid("Invalid subject ID"),
  academicSessionId: z.string().uuid("Invalid academic session ID"),
};

export const createTeacherAssignmentSchema = z
  .object(assignmentFields)
  .strict();

export const updateTeacherAssignmentSchema = z
  .object({
    teacherId: assignmentFields.teacherId.optional(),
    schoolClassId: assignmentFields.schoolClassId.optional(),
    subjectId: assignmentFields.subjectId.optional(),
    academicSessionId: assignmentFields.academicSessionId.optional(),
  })
  .strict()
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: "Provide at least one field to update" }
  );

export const teacherAssignmentIdSchema = z.object({
  id: z.string().uuid("Invalid teacher assignment ID"),
});

export const listTeacherAssignmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  teacherId: z.string().uuid().optional(),
  schoolClassId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  academicSessionId: z.string().uuid().optional(),
});