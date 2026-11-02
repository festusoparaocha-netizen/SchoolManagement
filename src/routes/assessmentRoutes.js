import { Router } from "express";

import {
  createAssessmentController,
  listAssessmentsController,
  getAssessmentController,
  updateAssessmentController,
} from "../controllers/assessmentController.js";

import {
  createAssessmentSchema,
  updateAssessmentSchema,
  assessmentIdSchema,
} from "../schemas/assessmentSchema.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  validate,
  validateParams,
} from "../middleware/validate.js";

const router = Router();

// Administrators and teachers can manage assessments.
router.use(
  authenticate,
  authorizeRoles("ADMIN", "TEACHER")
);

router.post(
  "/",
  validate(createAssessmentSchema),
  createAssessmentController
);

router.get("/", listAssessmentsController);

router.get(
  "/:id",
  validateParams(assessmentIdSchema),
  getAssessmentController
);

router.patch(
  "/:id",
  validateParams(assessmentIdSchema),
  validate(updateAssessmentSchema),
  updateAssessmentController
);

export default router;