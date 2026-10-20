
import { z } from "zod";

const studentFields = {
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().trim().email("A valid email address is required")
    .transform((value) => value.toLowerCase()),
  password: z.string().min(12, "Password must be at least 12 characters").max(128),
  admissionNumber: z.string().trim().min(2).max(30),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.string().trim().max(30).optional(),
  address: z.string().trim().max(300).optional()
};

export const createStudentSchema = z.object(studentFields);

export const updateStudentSchema = z.object({
  fullName: studentFields.fullName.optional(),
  email: studentFields.email.optional(),
  admissionNumber: studentFields.admissionNumber.optional(),
  dateOfBirth: z.coerce.date().nullable().optional(),
  gender: z.string().trim().max(30).nullable().optional(),
  address: z.string().trim().max(300).nullable().optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Provide at least one field to update" }
);

export const studentIdSchema = z.object({
  id: z.string().uuid("Student ID must be a valid UUID")
});
