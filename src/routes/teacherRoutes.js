
import { Router } from "express";

import {
  createTeacherController,
  listTeachersController,
  getTeacherController,
  updateTeacherController,
  deactivateTeacherController
} from "../controllers/teacherController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { validate, validateParams } from "../middleware/validate.js";

import {
  createTeacherSchema,
  updateTeacherSchema,
  teacherIdSchema
} from "../schemas/teacherSchema.js";

const router = Router();

// Only authenticated administrators can manage teachers.
router.use(authenticate, authorizeRoles("ADMIN"));

router.post(
  "/",
  validate(createTeacherSchema),
  createTeacherController
);

router.get("/", listTeachersController);

router.get(
  "/:id",
  validateParams(teacherIdSchema),
  getTeacherController
);

router.patch(
  "/:id",
  validateParams(teacherIdSchema),
  validate(updateTeacherSchema),
  updateTeacherController
);

router.patch(
  "/:id/deactivate",
  validateParams(teacherIdSchema),
  deactivateTeacherController
);

export default router;
