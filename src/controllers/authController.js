
import { loginUser } from "../services/authService.js";

export async function login(req, res, next) {
  try {
    const result = await loginUser(req.validatedBody);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    next(error);
  }
}
