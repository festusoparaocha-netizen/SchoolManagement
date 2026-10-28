
import { z } from "zod";

const subjectFields = {
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().min(2).max(20)
    .transform((value) => value.toUpperCase()),
  description: z.string().trim().max(500).nullable().optional()
};

export const createSubjectSchema = z.object(subjectFields);

export const updateSubjectSchema = z.object({
  name: subjectFields.name.optional(),
  code: subjectFields.code.optional(),
  description: subjectFields.description
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Provide at least one field to update" }
);

export const subjectIdSchema = z.object({
  id: z.string().uuid("Subject ID must be a valid UUID")
});
