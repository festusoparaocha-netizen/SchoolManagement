
import { z } from "zod";

const teacherFields = {
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().trim().email("A valid email address is required")
    .transform((value) => value.toLowerCase()),
  password: z.string().min(12, "Password must be at least 12 characters").max(128),
  staffNumber: z.string().trim().min(2, "Staff number is required").max(30),
  qualification: z.string().trim().max(150).optional(),
  employmentDate: z.coerce.date().optional()
};

export const createTeacherSchema = z.object(teacherFields);

export const updateTeacherSchema = z.object({
  fullName: teacherFields.fullName.optional(),
  email: teacherFields.email.optional(),
  staffNumber: teacherFields.staffNumber.optional(),
  qualification: z.string().trim().max(150).nullable().optional(),
  employmentDate: z.coerce.date().nullable().optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Provide at least one field to update" }
);

export const teacherIdSchema = z.object({
  id: z.string().uuid("Teacher ID must be a valid UUID")
});
