import { Router } from "express";

import {
  createAttendanceController,
  listAttendanceController,
  getAttendanceController,
  updateAttendanceController,
} from "../controllers/attendanceController.js";

import {
  createAttendanceSchema,
  updateAttendanceSchema,
  attendanceIdSchema,
} from "../schemas/attendanceSchema.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  validate,
  validateParams,
} from "../middleware/validate.js";

const router = Router();

// Both administrators and teachers can access attendance.
router.use(
  authenticate,
  authorizeRoles("ADMIN", "TEACHER")
);

// Record attendance.
router.post(
  "/",
  validate(createAttendanceSchema),
  createAttendanceController
);

// Retrieve attendance records.
router.get("/", listAttendanceController);

// Retrieve one attendance record.
router.get(
  "/:id",
  validateParams(attendanceIdSchema),
  getAttendanceController
);

// Update an attendance record.
router.patch(
  "/:id",
  validateParams(attendanceIdSchema),
  validate(updateAttendanceSchema),
  updateAttendanceController
);

export default router;