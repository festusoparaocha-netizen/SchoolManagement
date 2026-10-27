
import { z } from "zod";

const classFields = {
  name: z.string().trim().min(2, "Class name must be at least 2 characters").max(100),
  level: z.string().trim().max(50).nullable().optional(),
  description: z.string().trim().max(500).nullable().optional()
};

export const createClassSchema = z.object({
  name: classFields.name,
  level: classFields.level,
  description: classFields.description
});

export const updateClassSchema = z.object({
  name: classFields.name.optional(),
  level: classFields.level,
  description: classFields.description
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Provide at least one field to update" }
);

export const classIdSchema = z.object({
  id: z.string().uuid("Class ID must be a valid UUID")
});
