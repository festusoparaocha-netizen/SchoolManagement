
import { Router } from "express";
import { getCurrentUser } from "../controllers/userController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.get("/me", authenticate, getCurrentUser);

router.get(
  "/admin-check",
  authenticate,
  authorizeRoles("ADMIN"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Administrator access confirmed",
      data: { user: req.user }
    });
  }
);

export default router;
