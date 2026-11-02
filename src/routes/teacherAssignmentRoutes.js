import { Router } from "express";

import {
  createAssignment,
  listAssignments,
  getAssignment,
  updateAssignment,
  removeAssignment,
} from "../controllers/teacherAssignmentController.js";

import {
  createTeacherAssignmentSchema,
  updateTeacherAssignmentSchema,
  teacherAssignmentIdSchema,
} from "../schemas/teacherAssignmentSchema.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  validate,
  validateParams,
} from "../middleware/validate.js";

const router = Router();

// Only administrators can manage teacher assignments.
router.use(authenticate, authorizeRoles("ADMIN"));

// Create an assignment.
router.post(
  "/",
  validate(createTeacherAssignmentSchema),
  createAssignment
);

// Retrieve all assignments.
router.get("/", listAssignments);

// Retrieve one assignment.
router.get(
  "/:id",
  validateParams(teacherAssignmentIdSchema),
  getAssignment
);

// Update an assignment.
router.patch(
  "/:id",
  validateParams(teacherAssignmentIdSchema),
  validate(updateTeacherAssignmentSchema),
  updateAssignment
);

// Delete an assignment.
router.delete(
  "/:id",
  validateParams(teacherAssignmentIdSchema),
  removeAssignment
);

export default router;