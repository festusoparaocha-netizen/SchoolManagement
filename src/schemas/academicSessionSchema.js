
import { z } from "zod";

const sessionFields = {
  name: z
    .string()
    .trim()
    .min(4, "Session name must be at least 4 characters")
    .max(30, "Session name cannot exceed 30 characters"),

  startDate: z.coerce.date({
    error: "A valid start date is required",
  }),

  endDate: z.coerce.date({
    error: "A valid end date is required",
  }),
};

function validateDateRange(data, ctx) {
  if (data.startDate >= data.endDate) {
    ctx.addIssue({
      code: "custom",
      path: ["endDate"],
      message: "End date must be after start date",
    });
  }
}

export const createAcademicSessionSchema = z
  .object(sessionFields)
  .strict()
  .superRefine(validateDateRange);

export const updateAcademicSessionSchema = z
  .object({
    name: sessionFields.name.optional(),
    startDate: sessionFields.startDate.optional(),
    endDate: sessionFields.endDate.optional(),
  })
  .strict()
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: "Provide at least one field to update" }
  )
  .superRefine((data, ctx) => {
    if (
      data.startDate !== undefined &&
      data.endDate !== undefined
    ) {
      validateDateRange(data, ctx);
    }
  });

export const academicSessionIdSchema = z.object({
  id: z.string().uuid("Invalid academic session ID"),
});

export const listAcademicSessionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
});
