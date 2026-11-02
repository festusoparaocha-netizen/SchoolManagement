
import { Router } from "express";

import {
  createSession,
  listSessions,
  getSession,
  updateSession,
  setCurrentSession,
} from "../controllers/academicSessionController.js";

import {
  createAcademicSessionSchema,
  updateAcademicSessionSchema,
  academicSessionIdSchema,
} from "../schemas/academicSessionSchema.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  validate,
  validateParams,
} from "../middleware/validate.js";

const router = Router();

router.use(authenticate, authorizeRoles("ADMIN"));

router.post(
  "/",
  validate(createAcademicSessionSchema),
  createSession
);

router.get("/", listSessions);

router.get(
  "/:id",
  validateParams(academicSessionIdSchema),
  getSession
);

router.patch(
  "/:id",
  validateParams(academicSessionIdSchema),
  validate(updateAcademicSessionSchema),
  updateSession
);

router.patch(
  "/:id/set-current",
  validateParams(academicSessionIdSchema),
  setCurrentSession
);

export default router;
