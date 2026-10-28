
import { Router } from "express";

import {
  createSubjectController,
  listSubjectsController,
  getSubjectController,
  updateSubjectController
} from "../controllers/subjectController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { validate, validateParams } from "../middleware/validate.js";

import {
  createSubjectSchema,
  updateSubjectSchema,
  subjectIdSchema
} from "../schemas/subjectSchema.js";

const router = Router();

router.use(authenticate, authorizeRoles("ADMIN"));

router.post("/", validate(createSubjectSchema), createSubjectController);
router.get("/", listSubjectsController);

router.get(
  "/:id",
  validateParams(subjectIdSchema),
  getSubjectController
);

router.patch(
  "/:id",
  validateParams(subjectIdSchema),
  validate(updateSubjectSchema),
  updateSubjectController
);

export default router;
