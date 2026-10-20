
import { Router } from "express";

import {
  createStudentController,
  listStudentsController,
  getStudentController,
  updateStudentController,
  deactivateStudentController
} from "../controllers/studentController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { validate, validateParams } from "../middleware/validate.js";

import {
  createStudentSchema,
  updateStudentSchema,
  studentIdSchema
} from "../schemas/studentSchema.js";

const router = Router();

// All student-management endpoints require administrator access.
router.use(authenticate, authorizeRoles("ADMIN"));

router.post(
  "/",
  validate(createStudentSchema),
  createStudentController
);

router.get("/", listStudentsController);

router.get(
  "/:id",
  validateParams(studentIdSchema),
  getStudentController
);

router.patch(
  "/:id",
  validateParams(studentIdSchema),
  validate(updateStudentSchema),
  updateStudentController
);

router.patch(
  "/:id/deactivate",
  validateParams(studentIdSchema),
  deactivateStudentController
);

export default router;
