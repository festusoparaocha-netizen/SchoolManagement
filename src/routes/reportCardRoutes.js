
import { Router } from "express";

import {
  generateReportCardsController,
  listReportCardsController,
  getReportCardController
} from "../controllers/reportCardController.js";

import {
  generateReportCardsSchema,
  listReportCardsQuerySchema,
  reportCardIdSchema
} from "../schemas/reportCardSchema.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

// Reusable validation middleware for request data.
function validateRequest(schema, source, property) {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: {
          errors: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message
          }))
        }
      });
    }

    req[property] = result.data;
    next();
  };
}

// All report-card management endpoints require authentication.
// Only administrators can generate and manage report cards.
router.use(authenticate, authorizeRoles("ADMIN"));

// Generate report cards.
router.post(
  "/generate",
  validateRequest(
    generateReportCardsSchema,
    "body",
    "validatedBody"
  ),
  generateReportCardsController
);

// List report cards.
router.get(
  "/",
  validateRequest(
    listReportCardsQuerySchema,
    "query",
    "validatedQuery"
  ),
  listReportCardsController
);

// Retrieve an individual report card.
router.get(
  "/:id",
  validateRequest(
    reportCardIdSchema,
    "params",
    "validatedParams"
  ),
  getReportCardController
);

export default router;
