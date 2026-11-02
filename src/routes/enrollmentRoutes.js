import { Router } from "express";

import {
  createEnrollmentController,
  listEnrollmentsController,
  getEnrollmentController,
  updateEnrollmentController,
} from "../controllers/enrollmentController.js";

import {
  createEnrollmentSchema,
  updateEnrollmentSchema,
  enrollmentIdSchema,
} from "../schemas/enrollmentSchema.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  validate,
  validateParams,
} from "../middleware/validate.js";

const router = Router();

// Only authenticated administrators can manage enrollments.
router.use(authenticate, authorizeRoles("ADMIN"));

router.post(
  "/",
  validate(createEnrollmentSchema),
  createEnrollmentController
);

router.get("/", listEnrollmentsController);

router.get(
  "/:id",
  validateParams(enrollmentIdSchema),
  getEnrollmentController
);

router.patch(
  "/:id",
  validateParams(enrollmentIdSchema),
  validate(updateEnrollmentSchema),
  updateEnrollmentController
);

export default router;