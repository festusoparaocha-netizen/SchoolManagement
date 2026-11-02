import { Router } from "express";

import {
  createResultController,
  listResultsController,
  getResultController,
  updateResultController,
  submitResultController,
  approveResultController,
  publishResultController,
} from "../controllers/resultController.js";

import {
  createResultSchema,
  updateResultSchema,
  resultIdSchema,
} from "../schemas/resultSchema.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  validate,
  validateParams,
} from "../middleware/validate.js";

const router = Router();

// Administrators and teachers can work with results.
router.use(
  authenticate,
  authorizeRoles("ADMIN", "TEACHER")
);

// Record a student's result.
router.post(
  "/",
  validate(createResultSchema),
  createResultController
);

// Retrieve results.
router.get("/", listResultsController);

// Retrieve one result.
router.get(
  "/:id",
  validateParams(resultIdSchema),
  getResultController
);

// Update a draft result.
router.patch(
  "/:id",
  validateParams(resultIdSchema),
  validate(updateResultSchema),
  updateResultController
);

// Submit a draft result for approval.
router.patch(
  "/:id/submit",
  validateParams(resultIdSchema),
  submitResultController
);

// Only administrators can approve results.
router.patch(
  "/:id/approve",
  authenticate,
  authorizeRoles("ADMIN"),
  validateParams(resultIdSchema),
  approveResultController
);

// Only administrators can publish approved results.
router.patch(
  "/:id/publish",
  authenticate,
  authorizeRoles("ADMIN"),
  validateParams(resultIdSchema),
  publishResultController
);

export default router;