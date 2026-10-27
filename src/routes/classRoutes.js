
import { Router } from "express";

import {
  createClassController,
  listClassesController,
  getClassController,
  updateClassController,
  deactivateClassController
} from "../controllers/classController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { validate, validateParams } from "../middleware/validate.js";

import {
  createClassSchema,
  updateClassSchema,
  classIdSchema
} from "../schemas/classSchema.js";

const router = Router();

router.use(authenticate, authorizeRoles("ADMIN"));

router.post(
  "/",
  validate(createClassSchema),
  createClassController
);

router.get("/", listClassesController);

router.get(
  "/:id",
  validateParams(classIdSchema),
  getClassController
);

router.patch(
  "/:id",
  validateParams(classIdSchema),
  validate(updateClassSchema),
  updateClassController
);

router.patch(
  "/:id/deactivate",
  validateParams(classIdSchema),
  deactivateClassController
);

export default router;
