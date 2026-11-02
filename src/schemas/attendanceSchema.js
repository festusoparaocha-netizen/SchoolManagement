import { z } from "zod";

const attendanceStatuses = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "EXCUSED",
];

// Accept a date in YYYY-MM-DD format.
const attendanceDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value;
  }, "Invalid calendar date")
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

export const createAttendanceSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  schoolClassId: z.string().uuid("Invalid school class ID"),
  academicSessionId: z.string().uuid("Invalid academic session ID"),
  date: attendanceDateSchema,
  status: z.enum(attendanceStatuses),
  remarks: z.string().trim().max(500).optional(),
}).strict();

export const updateAttendanceSchema = z.object({
  status: z.enum(attendanceStatuses).optional(),
  remarks: z.string().trim().max(500).nullable().optional(),
}).strict().refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: "Provide at least one field to update" }
);

export const attendanceIdSchema = z.object({
  id: z.string().uuid("Invalid attendance ID"),
});

export const listAttendanceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  studentId: z.string().uuid().optional(),
  schoolClassId: z.string().uuid().optional(),
  academicSessionId: z.string().uuid().optional(),
  status: z.enum(attendanceStatuses).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).refine(
  (data) => !data.startDate || !data.endDate || data.startDate <= data.endDate,
  { message: "startDate must not be after endDate", path: ["startDate"] }
);